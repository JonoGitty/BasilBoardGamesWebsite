import { supabase } from '../lib/supabase';
import type { AdminGameRow, GameUpdatePayload, PostRow, PostPayload } from '../types/admin';
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

// ── Games ────────────────────────────────────────────────

/** Fetch ALL games (including vaulted) for admin management. */
export async function fetchAllGames(): Promise<AdminGameRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('games')
    .select('id, title, description, emoji, url, pinned, vault, cooldown_until, updated_at, created_at')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as AdminGameRow[];
}

/** Update a game's fields. Returns true on success. */
export async function updateGame(
  gameId: string,
  payload: GameUpdatePayload,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('games')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', gameId);

  if (error) return { ok: false, error: error.message };
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
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase.from('posts').insert({
    id: payload.id,
    title: payload.title,
    description: payload.description,
    emoji: payload.emoji,
    category: payload.category,
    published: false,
    created_by: userId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Update an existing post's content fields. */
export async function updatePost(
  postId: string,
  payload: Partial<PostPayload>,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('posts')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Publish a post (sets published=true and published_at to now). */
export async function publishPost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('posts')
    .update({
      published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Unpublish a post. */
export async function unpublishPost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('posts')
    .update({
      published: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Delete a post. */
export async function deletePost(
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Exported for testing
export { toAdminPost };
