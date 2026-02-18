import { supabase } from '../lib/supabase';
import type { AdminCommandName, AdminGameRow, GameUpdatePayload, PostRow, PostPayload, FeedbackRow } from '../types/admin';
import type { AdminPost } from '../types/whatsNew';

// ── Mapping helpers ──────────────────────────────────────

function toAdminPost(row: PostRow): AdminPost {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    category: row.category,
    published: row.published,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

interface CommandEnvelope<TResult> {
  ok?: boolean;
  result?: TResult;
  error?: string;
}

async function invokeAdminCommand<TResult>(
  name: AdminCommandName,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; result?: TResult; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data, error } = await supabase.functions.invoke('admin-command', {
    body: { name, args },
    headers,
  });

  if (error) {
    // FunctionsHttpError stores the raw Response in error.context
    const resp = (error as { context?: Response }).context;
    if (resp && typeof resp.json === 'function') {
      try {
        const body = await resp.json();
        return { ok: false, error: body?.error ?? error.message };
      } catch { /* fall through */ }
    }
    return { ok: false, error: error.message };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Invalid command response' };
  }

  const envelope = data as CommandEnvelope<TResult>;
  if (!envelope.ok) {
    return { ok: false, error: envelope.error ?? 'Admin command failed' };
  }

  return { ok: true, result: envelope.result };
}

// ── Games ────────────────────────────────────────────────

/** Fetch ALL games (including vaulted/disabled) for admin management. */
export async function fetchAllGames(): Promise<{ data: AdminGameRow[]; error?: string }> {
  if (!supabase) return { data: [], error: 'Supabase not configured' };

  const { data, error } = await supabase
    .from('games')
    .select('id, title, description, emoji, url, pinned, vault, enabled, status, sort_order, cooldown_until, updated_at, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };
  if (!data) return { data: [], error: 'No data returned' };
  return { data: data as AdminGameRow[] };
}

/** Update a game's fields. Returns true on success. */
export async function updateGame(
  gameId: string,
  payload: GameUpdatePayload,
): Promise<{ ok: boolean; error?: string }> {
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return { ok: false, error: 'No changes provided' };
  }

  const cmd = await invokeAdminCommand<{ game: AdminGameRow }>('games.patch', {
    gameId,
    changes: payload,
  });
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Update failed' };
  }
  return { ok: true };
}

/** Deterministically set the full active lineup (all other games are vaulted). */
export async function setActiveLineup(
  activeGameIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (activeGameIds.length === 0) {
    return { ok: false, error: 'At least one game is required' };
  }

  const cmd = await invokeAdminCommand<{ activeGameIds: string[] }>(
    'games.set_active_lineup',
    { activeGameIds },
  );
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Failed to set lineup' };
  }
  return { ok: true };
}

// ── Posts ─────────────────────────────────────────────────

/** Fetch all posts (including drafts) for admin management. */
export async function fetchAllPosts(): Promise<AdminPost[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, description, emoji, category, published, published_at, created_by, updated_at, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as PostRow[]).map(toAdminPost);
}

/** Create a new post (draft by default). */
export async function createPost(
  payload: PostPayload,
): Promise<{ ok: boolean; error?: string }> {
  const cmd = await invokeAdminCommand<{ post: AdminPost }>('posts.upsert_draft', {
    id: payload.id,
    title: payload.title,
    description: payload.description,
    emoji: payload.emoji,
    category: payload.category,
  });
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Create failed' };
  }
  return { ok: true };
}

/** Update an existing post's content fields. */
export async function updatePost(
  postId: string,
  payload: Partial<PostPayload>,
): Promise<{ ok: boolean; error?: string }> {
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return { ok: false, error: 'No changes provided' };
  }

  const cmd = await invokeAdminCommand<{ post: AdminPost }>('posts.patch', {
    postId,
    changes: payload,
  });
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Update failed' };
  }
  return { ok: true };
}

/** Publish a post (sets published=true and published_at to now). */
export async function publishPost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  const cmd = await invokeAdminCommand<{ post: AdminPost }>('posts.set_published', {
    postId,
    published: true,
  });
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Publish failed' };
  }
  return { ok: true };
}

/** Unpublish a post. */
export async function unpublishPost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  const cmd = await invokeAdminCommand<{ post: AdminPost }>('posts.set_published', {
    postId,
    published: false,
  });
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Unpublish failed' };
  }
  return { ok: true };
}

/** Delete a post. */
export async function deletePost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  const cmd = await invokeAdminCommand<{ postId: string; deleted: boolean }>(
    'posts.delete',
    { postId },
  );
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Delete failed' };
  }
  return { ok: true };
}

// ── Site settings ────────────────────────────────────────

/** Set the launcher style via admin command. */
export async function setLauncherStyle(
  style: import('../types/profile').LauncherStyle,
): Promise<{ ok: boolean; error?: string }> {
  const cmd = await invokeAdminCommand<{ style: string }>(
    'site.set_launcher_style',
    { style },
  );
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Failed to set launcher style' };
  }
  return { ok: true };
}

// ── Feedback ──────────────────────────────────────────────

/** Fetch feedback entries (admin RLS allows SELECT). */
export async function fetchFeedback(
  filters?: { status?: string; gameId?: string },
): Promise<{ data: FeedbackRow[]; error?: string }> {
  if (!supabase) return { data: [], error: 'Supabase not configured' };

  let query = supabase
    .from('feedback')
    .select('id, created_at, game_id, page, source, feedback_text, context_json, client_feedback_id, ip_hash, status, admin_note')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.gameId) {
    query = query.eq('game_id', filters.gameId);
  }

  const { data, error } = await query;

  if (error) return { data: [], error: error.message };
  if (!data) return { data: [], error: 'No data returned' };
  return { data: data as FeedbackRow[] };
}

/** Update feedback status via admin command. */
export async function updateFeedbackStatus(
  feedbackId: number,
  status: string,
  adminNote?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const args: Record<string, unknown> = { feedbackId, status };
  if (adminNote !== undefined) args.adminNote = adminNote;

  const cmd = await invokeAdminCommand<{ feedback: FeedbackRow }>(
    'feedback.update_status',
    args,
  );
  if (!cmd.ok) {
    return { ok: false, error: cmd.error ?? 'Update failed' };
  }
  return { ok: true };
}

// Exported for testing
export { toAdminPost };
