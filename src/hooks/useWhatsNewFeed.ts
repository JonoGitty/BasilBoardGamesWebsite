import { useState, useEffect } from 'react';
import { WHATS_NEW_POSTS } from '../data/whatsNew';
import { fetchPublishedFeed } from '../services/postsFeedApi';
import type { WhatsNewPost } from '../types/whatsNew';

/** Hardcoded fallback — displayed instantly before Supabase responds. */
const FALLBACK: WhatsNewPost[] = sortFeedByPublishedAtDesc(WHATS_NEW_POSTS);

function sortFeedByPublishedAtDesc(posts: readonly WhatsNewPost[]): WhatsNewPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * Resolve the displayed feed.
 * - `null` means Supabase unavailable/error: keep fallback.
 * - array means successful fetch (including empty): DB is authoritative.
 */
export function resolveWhatsNewFeed(
  fetched: WhatsNewPost[] | null,
  fallback: readonly WhatsNewPost[] = FALLBACK,
): WhatsNewPost[] {
  if (fetched === null) return sortFeedByPublishedAtDesc(fallback);
  return sortFeedByPublishedAtDesc(fetched);
}

export function useWhatsNewFeed(): WhatsNewPost[] {
  const [posts, setPosts] = useState<WhatsNewPost[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetchPublishedFeed().then((fetched) => {
      if (!cancelled && fetched !== null) {
        // DB is authoritative once available; fallback remains only for offline/unavailable cases.
        setPosts(resolveWhatsNewFeed(fetched));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return posts;
}
