// Deno Edge Function — validates and inserts telemetry events
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Valid event names (duplicated from client EventMap — Deno can't import from src/)
const VALID_EVENT_NAMES = [
  "app_open",
  "card_click",
  "game_start",
  "game_end",
  "whats_new_expand",
  "settings_change",
  "auth_sign_up",
  "auth_sign_in",
  "auth_sign_out",
  "admin_open",
  "admin_game_update",
  "admin_post_create",
  "admin_post_publish",
  "admin_post_unpublish",
  "admin_post_delete",
] as const;

type EventName = (typeof VALID_EVENT_NAMES)[number];

interface IngestEvent {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidEvent(e: unknown): e is IngestEvent {
  if (typeof e !== "object" || e === null) return false;
  const obj = e as Record<string, unknown>;
  if (typeof obj.id !== "string" || !UUID_RE.test(obj.id)) return false;
  if (typeof obj.name !== "string") return false;
  if (!VALID_EVENT_NAMES.includes(obj.name as EventName)) return false;
  if (
    typeof obj.payload !== "object" ||
    obj.payload === null ||
    Array.isArray(obj.payload)
  )
    return false;
  if (typeof obj.timestamp !== "number" || obj.timestamp <= 0) return false;
  return true;
}

function getUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(atob(payloadB64));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const MAX_BATCH = 200;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { events?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return json({ error: "events must be a non-empty array" }, 400);
  }

  if (body.events.length > MAX_BATCH) {
    return json({ error: `Batch exceeds max size of ${MAX_BATCH}` }, 400);
  }

  const valid: IngestEvent[] = [];
  const invalid: number[] = [];
  for (let i = 0; i < body.events.length; i++) {
    if (isValidEvent(body.events[i])) {
      valid.push(body.events[i] as IngestEvent);
    } else {
      invalid.push(i);
    }
  }

  if (valid.length === 0) {
    return json({ error: "No valid events", invalid }, 400);
  }

  const userId = getUserIdFromJwt(req.headers.get("Authorization"));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rows = valid.map((e) => ({
    event_id: e.id,
    user_id: userId,
    name: e.name,
    payload: e.payload,
    timestamp: e.timestamp,
  }));

  const { error } = await supabase
    .from("events")
    .upsert(rows, { onConflict: "event_id", ignoreDuplicates: true });

  if (error) {
    console.error("Insert error:", error);
    return json({ error: "Insert failed" }, 500);
  }

  return json({ inserted: valid.length, skipped_invalid: invalid.length });
});
