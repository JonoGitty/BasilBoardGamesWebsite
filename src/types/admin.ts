import type { PostCategory } from './whatsNew';
import type { GameStatus } from './game';

/** Row shape returned from Supabase games table for admin use. */
export interface AdminGameRow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  url: string | null;
  pinned: boolean;
  vault: boolean;
  enabled: boolean;
  status: GameStatus;
  sort_order: number;
  cooldown_until: string | null;
  updated_at: string;
  created_at: string;
}

/** Payload for updating a game. */
export interface GameUpdatePayload {
  title?: string;
  description?: string;
  emoji?: string;
  url?: string | null;
  pinned?: boolean;
  vault?: boolean;
  enabled?: boolean;
  status?: GameStatus;
  sort_order?: number;
}

/** Row shape returned from Supabase posts table. */
export interface PostRow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: PostCategory;
  published: boolean;
  published_at: string | null;
  created_by: string | null;
  updated_at: string;
  created_at: string;
}

/** Payload for creating or updating a post. */
export interface PostPayload {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: PostCategory;
}

/** Row shape returned from Supabase feedback table for admin use. */
export interface FeedbackRow {
  id: number;
  created_at: string;
  game_id: string | null;
  page: string;
  source: string;
  feedback_text: string;
  context_json: Record<string, unknown>;
  client_feedback_id: string;
  ip_hash: string | null;
  status: 'new' | 'reviewed' | 'resolved' | 'dismissed';
  admin_note: string | null;
}

/** Deterministic backend command names for admin operations. */
export type AdminCommandName =
  | 'games.patch'
  | 'games.set_active_lineup'
  | 'posts.upsert_draft'
  | 'posts.patch'
  | 'posts.set_published'
  | 'posts.delete'
  | 'site.set_launcher_style'
  | 'feedback.update_status';
