import { supabase } from '../lib/supabase';
import type { WhatsNewPost } from '../types/whatsNew';

interface PostFeedRow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  published_at: string;
}

function toWhatsNewPost(row: PostFeedRow): WhatsNewPost {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    category: row.category as WhatsNewPost['category'],
    publishedAt: row.published_at,
  };
}

/**
 * Fetch published posts for the public What's New feed.
 * Returns `null` only when Supabase is unavailable or request fails,
 * so callers can safely keep a static fallback in that case.
 */
export async function fetchPublishedFeed(): Promise<WhatsNewPost[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, description, emoji, category, published_at')
    .eq('published', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error || !data) return null;
  return (data as PostFeedRow[]).map(toWhatsNewPost);
}

// Exported for testing
export { toWhatsNewPost };
