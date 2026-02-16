import type { PostCategory } from './whatsNew';

/** Row shape returned from Supabase games table for admin use. */
export interface AdminGameRow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  url: string | null;
  pinned: boolean;
  vault: boolean;
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
