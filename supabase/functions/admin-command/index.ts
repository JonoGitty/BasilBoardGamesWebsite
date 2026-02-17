// Deno Edge Function — deterministic admin command executor
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const POST_CATEGORIES = new Set(["patch", "experiment", "announcement"]);
const VALID_LAUNCHER_STYLES = new Set(["classic", "craft-desk", "netflix"]);
const VALID_COMMANDS = [
  "games.patch",
  "games.set_active_lineup",
  "posts.upsert_draft",
  "posts.patch",
  "posts.set_published",
  "posts.delete",
  "site.set_launcher_style",
] as const;

type CommandName = (typeof VALID_COMMANDS)[number];

interface CommandRequest {
  name: CommandName;
  args: Record<string, unknown>;
}

class CommandError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function fail(status: number, code: string, message: string): never {
  throw new CommandError(status, code, message);
}

function readStringField(
  obj: Record<string, unknown>,
  key: string,
  maxLen = 200,
): string {
  const value = obj[key];
  if (typeof value !== "string") {
    fail(400, "invalid_args", `Expected "${key}" to be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    fail(400, "invalid_args", `"${key}" cannot be empty`);
  }
  if (trimmed.length > maxLen) {
    fail(400, "invalid_args", `"${key}" exceeds max length ${maxLen}`);
  }
  return trimmed;
}

function readBooleanField(
  obj: Record<string, unknown>,
  key: string,
): boolean {
  const value = obj[key];
  if (typeof value !== "boolean") {
    fail(400, "invalid_args", `Expected "${key}" to be a boolean`);
  }
  return value;
}

function parseCommandRequest(body: unknown): CommandRequest {
  if (!isPlainObject(body)) {
    fail(400, "invalid_request", "Request body must be an object");
  }

  const nameRaw = body.name;
  const argsRaw = body.args;

  if (typeof nameRaw !== "string") {
    fail(400, "invalid_request", 'Missing or invalid "name"');
  }
  if (!VALID_COMMANDS.includes(nameRaw as CommandName)) {
    fail(400, "unknown_command", `Unsupported command "${nameRaw}"`);
  }
  if (!isPlainObject(argsRaw)) {
    fail(400, "invalid_request", 'Missing or invalid "args"');
  }

  return {
    name: nameRaw as CommandName,
    args: argsRaw,
  };
}

function normalizeUrl(
  value: unknown,
): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    fail(400, "invalid_args", 'Expected "url" to be string or null');
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function requireAuthenticatedUserId(
  db: ReturnType<typeof createClient>,
  authHeader: string | null,
): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) {
    fail(401, "unauthorized", "Missing bearer token");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    fail(401, "unauthorized", "Missing bearer token");
  }

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) {
    fail(401, "unauthorized", "Invalid session token");
  }
  return data.user.id;
}

async function requireAdmin(
  db: ReturnType<typeof createClient>,
  actorUserId: string,
): Promise<void> {
  const { data, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", actorUserId)
    .maybeSingle();

  if (error) {
    console.error("Admin role lookup failed:", error);
    fail(500, "role_lookup_failed", "Failed to verify admin role");
  }
  if (!data || data.role !== "admin") {
    fail(403, "forbidden", "Admin role required");
  }
}

async function executeGamesPatch(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
) {
  const gameId = readStringField(args, "gameId", 80);
  const changesRaw = args.changes;
  if (!isPlainObject(changesRaw)) {
    fail(400, "invalid_args", 'Expected "changes" to be an object');
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  let updatedFields = 0;

  if ("title" in changesRaw) {
    update.title = readStringField(changesRaw, "title", 120);
    updatedFields += 1;
  }
  if ("description" in changesRaw) {
    update.description = readStringField(changesRaw, "description", 500);
    updatedFields += 1;
  }
  if ("emoji" in changesRaw) {
    update.emoji = readStringField(changesRaw, "emoji", 8);
    updatedFields += 1;
  }
  if ("url" in changesRaw) {
    update.url = normalizeUrl(changesRaw.url);
    updatedFields += 1;
  }
  if ("pinned" in changesRaw) {
    update.pinned = readBooleanField(changesRaw, "pinned");
    updatedFields += 1;
  }
  if ("vault" in changesRaw) {
    update.vault = readBooleanField(changesRaw, "vault");
    updatedFields += 1;
  }

  if (updatedFields === 0) {
    fail(400, "invalid_args", "No valid game fields provided in changes");
  }

  const { data, error } = await db
    .from("games")
    .update(update)
    .eq("id", gameId)
    .select("id, title, description, emoji, url, pinned, vault, updated_at")
    .maybeSingle();

  if (error) {
    fail(400, "game_update_failed", error.message);
  }
  if (!data) {
    fail(404, "game_not_found", `Game "${gameId}" was not found`);
  }

  return { game: data };
}

async function executeSetActiveLineup(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
  actorUserId: string,
) {
  const rawIds = args.activeGameIds;
  if (!Array.isArray(rawIds)) {
    fail(400, "invalid_args", 'Expected "activeGameIds" to be an array');
  }
  if (rawIds.length === 0) {
    fail(400, "invalid_args", '"activeGameIds" cannot be empty');
  }

  const activeGameIds = rawIds.map((value) => {
    if (typeof value !== "string") {
      fail(400, "invalid_args", "All activeGameIds entries must be strings");
    }
    const trimmed = value.trim();
    if (!trimmed) {
      fail(400, "invalid_args", "Game IDs cannot be empty");
    }
    return trimmed;
  });

  if (new Set(activeGameIds).size !== activeGameIds.length) {
    fail(400, "invalid_args", "activeGameIds must be unique");
  }

  const { data: games, error: gamesError } = await db
    .from("games")
    .select("id, vault");

  if (gamesError || !games) {
    fail(500, "games_fetch_failed", "Failed to fetch game catalog");
  }

  const existingIds = new Set(games.map((g) => g.id));
  const missing = activeGameIds.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    fail(400, "invalid_args", `Unknown game IDs: ${missing.join(", ")}`);
  }

  const activeSet = new Set(activeGameIds);
  const updatedAt = new Date().toISOString();

  const toActivate = games
    .filter((g) => activeSet.has(g.id) && g.vault)
    .map((g) => g.id);

  const toVault = games
    .filter((g) => !activeSet.has(g.id) && !g.vault)
    .map((g) => g.id);

  if (toActivate.length > 0) {
    const { error: activateErr } = await db
      .from("games")
      .update({ vault: false, cooldown_until: null, updated_at: updatedAt })
      .in("id", toActivate);

    if (activateErr) {
      fail(500, "lineup_update_failed", activateErr.message);
    }
  }

  if (toVault.length > 0) {
    const { error: vaultErr } = await db
      .from("games")
      .update({ vault: true, updated_at: updatedAt })
      .in("id", toVault);

    if (vaultErr) {
      fail(500, "lineup_update_failed", vaultErr.message);
    }
  }

  const updated = toActivate.length + toVault.length;

  const { error: logError } = await db.from("rotation_log").insert({
    triggered_by: `admin-command:${actorUserId}`,
    snapshot: activeGameIds,
    seed: "manual-lineup",
  });

  if (logError) {
    console.warn("rotation_log insert failed:", logError.message);
  }

  return {
    activeGameIds,
    updatedGames: updated,
  };
}

async function executeUpsertDraftPost(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
  actorUserId: string,
) {
  const id = readStringField(args, "id", 80);
  const title = readStringField(args, "title", 120);
  const description = readStringField(args, "description", 500);
  const emoji = readStringField(args, "emoji", 8);
  const category = readStringField(args, "category", 32);

  if (!POST_CATEGORIES.has(category)) {
    fail(400, "invalid_args", `Unknown post category "${category}"`);
  }

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("posts")
    .upsert({
      id,
      title,
      description,
      emoji,
      category,
      published: false,
      published_at: null,
      created_by: actorUserId,
      updated_at: now,
    }, { onConflict: "id" })
    .select(
      "id, title, description, emoji, category, published, published_at, created_by, updated_at, created_at",
    )
    .maybeSingle();

  if (error) {
    fail(400, "post_upsert_failed", error.message);
  }
  if (!data) {
    fail(500, "post_upsert_failed", "No row returned from upsert");
  }

  return { post: data };
}

async function executePatchPost(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
) {
  const postId = readStringField(args, "postId", 80);
  const changesRaw = args.changes;
  if (!isPlainObject(changesRaw)) {
    fail(400, "invalid_args", 'Expected "changes" to be an object');
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  let updatedFields = 0;

  if ("title" in changesRaw) {
    update.title = readStringField(changesRaw, "title", 120);
    updatedFields += 1;
  }
  if ("description" in changesRaw) {
    update.description = readStringField(changesRaw, "description", 500);
    updatedFields += 1;
  }
  if ("emoji" in changesRaw) {
    update.emoji = readStringField(changesRaw, "emoji", 8);
    updatedFields += 1;
  }
  if ("category" in changesRaw) {
    const category = readStringField(changesRaw, "category", 32);
    if (!POST_CATEGORIES.has(category)) {
      fail(400, "invalid_args", `Unknown post category "${category}"`);
    }
    update.category = category;
    updatedFields += 1;
  }

  if (updatedFields === 0) {
    fail(400, "invalid_args", "No valid post fields provided in changes");
  }

  const { data, error } = await db
    .from("posts")
    .update(update)
    .eq("id", postId)
    .select(
      "id, title, description, emoji, category, published, published_at, created_by, updated_at, created_at",
    )
    .maybeSingle();

  if (error) {
    fail(400, "post_update_failed", error.message);
  }
  if (!data) {
    fail(404, "post_not_found", `Post "${postId}" was not found`);
  }

  return { post: data };
}

async function executeSetPostPublished(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
) {
  const postId = readStringField(args, "postId", 80);
  const published = readBooleanField(args, "published");
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("posts")
    .update({
      published,
      published_at: published ? now : null,
      updated_at: now,
    })
    .eq("id", postId)
    .select(
      "id, title, description, emoji, category, published, published_at, created_by, updated_at, created_at",
    )
    .maybeSingle();

  if (error) {
    fail(400, "post_publish_failed", error.message);
  }
  if (!data) {
    fail(404, "post_not_found", `Post "${postId}" was not found`);
  }

  return { post: data };
}

async function executeDeletePost(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
) {
  const postId = readStringField(args, "postId", 80);

  const { data, error } = await db
    .from("posts")
    .delete()
    .eq("id", postId)
    .select("id")
    .maybeSingle();

  if (error) {
    fail(400, "post_delete_failed", error.message);
  }

  return {
    postId,
    deleted: !!data,
  };
}

async function executeSiteSetLauncherStyle(
  db: ReturnType<typeof createClient>,
  args: Record<string, unknown>,
  actorUserId: string,
) {
  const style = readStringField(args, "style", 20);
  if (!VALID_LAUNCHER_STYLES.has(style)) {
    fail(
      400,
      "invalid_args",
      `Invalid launcher style "${style}". Must be one of: ${[...VALID_LAUNCHER_STYLES].join(", ")}`,
    );
  }

  const { error } = await db
    .from("profiles")
    .update({ launcher_style: style, updated_at: new Date().toISOString() })
    .eq("id", actorUserId);

  if (error) {
    fail(500, "profile_update_failed", error.message);
  }

  return { style };
}

async function runCommand(
  db: ReturnType<typeof createClient>,
  command: CommandRequest,
  actorUserId: string,
) {
  switch (command.name) {
    case "games.patch":
      return await executeGamesPatch(db, command.args);
    case "games.set_active_lineup":
      return await executeSetActiveLineup(db, command.args, actorUserId);
    case "posts.upsert_draft":
      return await executeUpsertDraftPost(db, command.args, actorUserId);
    case "posts.patch":
      return await executePatchPost(db, command.args);
    case "posts.set_published":
      return await executeSetPostPublished(db, command.args);
    case "posts.delete":
      return await executeDeletePost(db, command.args);
    case "site.set_launcher_style":
      return await executeSiteSetLauncherStyle(db, command.args, actorUserId);
    default:
      fail(400, "unknown_command", "Unsupported command");
  }
}

async function writeAuditLog(
  db: ReturnType<typeof createClient>,
  entry: {
    command: string;
    actor_id: string;
    args: Record<string, unknown>;
    success: boolean;
    error_code?: string;
    error_msg?: string;
  },
): Promise<void> {
  try {
    await db.from("admin_command_log").insert({
      command: entry.command,
      actor_id: entry.actor_id,
      args: entry.args,
      success: entry.success,
      error_code: entry.error_code ?? null,
      error_msg: entry.error_msg ?? null,
    });
  } catch (logErr) {
    console.warn("audit log write failed:", logErr);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let actorUserId: string | undefined;
  let command: CommandRequest | undefined;

  try {
    actorUserId = await requireAuthenticatedUserId(
      db,
      req.headers.get("Authorization"),
    );
    await requireAdmin(db, actorUserId);

    const body = await req.json();
    command = parseCommandRequest(body);
    const result = await runCommand(db, command, actorUserId);

    await writeAuditLog(db, {
      command: command.name,
      actor_id: actorUserId,
      args: command.args,
      success: true,
    });

    return json({
      ok: true,
      command: command.name,
      actorUserId,
      result,
    });
  } catch (err) {
    if (err instanceof CommandError) {
      if (actorUserId && command) {
        await writeAuditLog(db, {
          command: command.name,
          actor_id: actorUserId,
          args: command.args,
          success: false,
          error_code: err.code,
          error_msg: err.message,
        });
      }

      return json({
        ok: false,
        code: err.code,
        error: err.message,
      }, err.status);
    }

    console.error("admin-command unexpected error:", err);

    if (actorUserId && command) {
      await writeAuditLog(db, {
        command: command.name,
        actor_id: actorUserId,
        args: command.args,
        success: false,
        error_code: "internal_error",
        error_msg: "Unexpected server error",
      });
    }

    return json({
      ok: false,
      code: "internal_error",
      error: "Unexpected server error",
    }, 500);
  }
});
