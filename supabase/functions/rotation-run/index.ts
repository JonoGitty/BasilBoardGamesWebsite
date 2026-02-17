// Deno Edge Function — executes a game rotation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Constants ---
const TARGET_ACTIVE = 4;
const COOLDOWN_DAYS = 14;

// --- Seeded PRNG (Mulberry32) — duplicated from src/utils/seededRandom.ts ---

function hashSeed(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: readonly T[], seedStr: string): T[] {
  const rng = mulberry32(hashSeed(seedStr));
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// --- Types ---

interface GameRow {
  id: string;
  pinned: boolean;
  vault: boolean;
  cooldown_until: string | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- Handler ---

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Auth: require service_role JWT (role claim = "service_role")
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== "service_role") {
      return json({ error: "Forbidden: service_role required" }, 403);
    }
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  // Optional body
  let trigger = "scheduler";
  let seedOverride: string | undefined;
  try {
    const body = await req.json();
    if (body.trigger === "manual") trigger = "manual";
    if (typeof body.seed_override === "string") seedOverride = body.seed_override;
  } catch {
    // No body is fine
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Read all games
  const { data: allGames, error: fetchErr } = await supabase
    .from("games")
    .select("id, pinned, vault, cooldown_until");

  if (fetchErr || !allGames) {
    console.error("Failed to fetch games:", fetchErr);
    return json({ error: "Failed to fetch games" }, 500);
  }

  const games = allGames as GameRow[];
  const now = new Date();

  // 2. Pinned games are always active
  const pinned = games.filter((g) => g.pinned);
  const nonPinned = games.filter((g) => !g.pinned);
  const remainingSlots = Math.max(0, TARGET_ACTIVE - pinned.length);

  // 3. Eligible: non-pinned, not in cooldown
  const eligible = nonPinned.filter((g) => {
    if (!g.cooldown_until) return true;
    return new Date(g.cooldown_until) <= now;
  });

  // 4. Seeded shuffle and pick
  const dateStr = now.toISOString().slice(0, 10);
  const seed = seedOverride ?? `rotation-${dateStr}`;
  const shuffled = seededShuffle(eligible, seed);
  const selected = shuffled.slice(0, remainingSlots);

  const activeIds = new Set([
    ...pinned.map((g) => g.id),
    ...selected.map((g) => g.id),
  ]);

  // 5. Cooldown timestamp for rotated-out games
  const cooldownUntil = new Date(
    now.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 6. Update games
  const previouslyActive = games.filter((g) => !g.vault && !g.pinned);
  const rotatedOut = previouslyActive.filter((g) => !activeIds.has(g.id));

  // Activate selected games
  for (const id of activeIds) {
    await supabase
      .from("games")
      .update({ vault: false, cooldown_until: null })
      .eq("id", id);
  }

  // Vault rotated-out games with cooldown
  for (const g of rotatedOut) {
    await supabase
      .from("games")
      .update({ vault: true, cooldown_until: cooldownUntil })
      .eq("id", g.id);
  }

  // 7. Audit log
  const snapshot = [...activeIds].sort();
  await supabase.from("rotation_log").insert({
    triggered_by: trigger,
    snapshot: JSON.stringify(snapshot),
    seed,
  });

  return json({
    active: snapshot,
    rotated_out: rotatedOut.map((g) => g.id),
    seed,
    trigger,
  });
});
