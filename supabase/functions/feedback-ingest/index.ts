// Deno Edge Function — validates and inserts anonymous feedback
// Deploy with: supabase functions deploy feedback-ingest --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────
// FEEDBACK_ALLOWED_ORIGINS: comma-separated allowlist.
// If unset, allows any origin (open anonymous endpoint).

function getAllowedOrigins(): Set<string> | null {
  const raw = Deno.env.get("FEEDBACK_ALLOWED_ORIGINS");
  if (!raw) return null; // null means allow all
  const origins = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return origins.length > 0 ? new Set(origins) : null;
}

function corsOrigin(req: Request): string {
  const allowed = getAllowedOrigins();
  if (!allowed) return "*";
  const origin = req.headers.get("origin") ?? "";
  return allowed.has(origin) ? origin : "";
}

function makeCorsHeaders(req: Request): Record<string, string> {
  const origin = corsOrigin(req);
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...(origin !== "*" ? { Vary: "Origin" } : {}),
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// ── Sanitisation (ported from Triarch server.py) ──────────────

function sanitizeText(text: string, maxLen: number): string {
  // Strip non-printable chars except newline/tab
  return text.replace(/[^\x20-\x7E\t\n\r\u00A0-\uFFFF]/g, "").slice(0, maxLen);
}

function sanitizeContext(
  obj: unknown,
  depth = 0,
  maxDepth = 4,
  maxStringLen = 300,
  maxItems = 100,
): unknown {
  if (depth > maxDepth) return null;

  if (typeof obj === "string") {
    return sanitizeText(obj, maxStringLen);
  }
  if (typeof obj === "number" || typeof obj === "boolean" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice(0, maxItems).map((item) =>
      sanitizeContext(item, depth + 1, maxDepth, maxStringLen, maxItems)
    );
  }
  if (isPlainObject(obj)) {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [key, val] of Object.entries(obj)) {
      if (count >= maxItems) break;
      out[sanitizeText(key, 64)] = sanitizeContext(
        val,
        depth + 1,
        maxDepth,
        maxStringLen,
        maxItems,
      );
      count++;
    }
    return out;
  }
  return null;
}

// ── IP hashing ────────────────────────────────────────────────

function requireSalt(): string {
  const salt = Deno.env.get("FEEDBACK_SALT");
  if (!salt) {
    throw {
      status: 500,
      code: "config_error",
      message: "Server misconfigured: FEEDBACK_SALT not set",
    };
  }
  return salt;
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Rate limiting via table query ─────────────────────────────

async function checkRateLimit(
  db: ReturnType<typeof createClient>,
  ipHash: string,
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const ratePerMinute = Number(
    Deno.env.get("FEEDBACK_RATE_PER_MINUTE") || "30",
  );
  const ratePerDay = Number(
    Deno.env.get("FEEDBACK_RATE_PER_DAY") || "2000",
  );

  // Check per-minute rate
  const { count: minuteCount } = await db
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());

  if ((minuteCount ?? 0) >= ratePerMinute) {
    return { allowed: false, retryAfterSec: 60 };
  }

  // Check per-day rate
  const { count: dayCount } = await db
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());

  if ((dayCount ?? 0) >= ratePerDay) {
    return { allowed: false, retryAfterSec: 3600 };
  }

  return { allowed: true };
}

// ── Validation ────────────────────────────────────────────────

interface ValidPayload {
  clientFeedbackId: string;
  feedback: string;
  page: string;
  source: string;
  gameId: string | null;
  context: Record<string, unknown>;
}

function validatePayload(body: unknown): ValidPayload {
  if (!isPlainObject(body)) {
    throw { status: 400, code: "invalid_request", message: "Body must be an object" };
  }

  const clientFeedbackId = body.clientFeedbackId;
  if (typeof clientFeedbackId !== "string" || !clientFeedbackId.trim()) {
    throw { status: 400, code: "missing_field", message: "clientFeedbackId is required" };
  }
  if (clientFeedbackId.length > 48) {
    throw { status: 400, code: "invalid_field", message: "clientFeedbackId exceeds max length 48" };
  }

  const feedback = body.feedback;
  if (typeof feedback !== "string") {
    throw { status: 400, code: "missing_field", message: "feedback is required" };
  }
  const trimmedFeedback = feedback.trim();
  if (!trimmedFeedback || trimmedFeedback.length < 1) {
    throw { status: 400, code: "invalid_field", message: "feedback cannot be empty" };
  }
  if (trimmedFeedback.length > 500) {
    throw { status: 400, code: "invalid_field", message: "feedback exceeds max length 500" };
  }

  const page = typeof body.page === "string" ? body.page.trim().slice(0, 32) : "unknown";
  const source = typeof body.source === "string" ? body.source.trim().slice(0, 32) : "ui";

  let gameId: string | null = null;
  if (typeof body.gameId === "string" && body.gameId.trim()) {
    gameId = body.gameId.trim().slice(0, 80);
  }

  let context: Record<string, unknown> = {};
  if (isPlainObject(body.context)) {
    const raw = JSON.stringify(body.context);
    if (raw.length <= 5120) {
      context = sanitizeContext(body.context) as Record<string, unknown>;
    }
  }

  return {
    clientFeedbackId: clientFeedbackId.trim(),
    feedback: sanitizeText(trimmedFeedback, 500),
    page: sanitizeText(page, 32),
    source: sanitizeText(source, 32),
    gameId,
    context,
  };
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = makeCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed", code: "method_not_allowed" }, 405, cors);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON", code: "invalid_json" }, 400, cors);
    }

    const payload = validatePayload(body);

    // Require FEEDBACK_SALT — fail safely if missing
    const salt = requireSalt();

    // Hash IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashIp(ip, salt);

    // Rate limit check
    const rateCheck = await checkRateLimit(db, ipHash);
    if (!rateCheck.allowed) {
      return json(
        {
          error: "Rate limit exceeded",
          code: "rate_limited",
          retryAfterSec: rateCheck.retryAfterSec,
        },
        429,
        cors,
      );
    }

    // Insert (service_role bypasses RLS)
    const { data, error } = await db
      .from("feedback")
      .insert({
        game_id: payload.gameId,
        page: payload.page,
        source: payload.source,
        feedback_text: payload.feedback,
        context_json: payload.context,
        client_feedback_id: payload.clientFeedbackId,
        ip_hash: ipHash,
      })
      .select("id, created_at")
      .single();

    if (error) {
      // Unique constraint violation — duplicate clientFeedbackId
      if (error.code === "23505") {
        const { data: existing } = await db
          .from("feedback")
          .select("id, created_at")
          .eq("client_feedback_id", payload.clientFeedbackId)
          .single();

        return json({
          ok: true,
          duplicate: true,
          receiptId: existing ? String(existing.id) : null,
          acceptedAt: existing?.created_at ?? null,
          clientFeedbackId: payload.clientFeedbackId,
        }, 200, cors);
      }

      console.error("Feedback insert error:", error);
      return json({ error: "Insert failed", code: "insert_failed" }, 500, cors);
    }

    return json(
      {
        ok: true,
        receiptId: String(data.id),
        acceptedAt: data.created_at,
        clientFeedbackId: payload.clientFeedbackId,
      },
      201,
      cors,
    );
  } catch (err) {
    if (
      err && typeof err === "object" && "status" in err && "code" in err
    ) {
      const e = err as { status: number; code: string; message: string };
      if (e.code === "config_error") {
        console.error("feedback-ingest config error:", e.message);
      }
      return json({ error: e.message, code: e.code }, e.status, cors);
    }

    console.error("feedback-ingest unexpected error:", err);
    return json({ error: "Unexpected server error", code: "internal_error" }, 500, cors);
  }
});
