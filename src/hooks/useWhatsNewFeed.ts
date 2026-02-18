import { useState, useEffect } from 'react';
import { WHATS_NEW_POSTS } from '../data/whatsNew';
import { fetchPublishedFeed } from '../services/postsFeedApi';
import type { WhatsNewPost } from '../types/whatsNew';

/** Hardcoded fallback — displayed instantly before Supabase responds. */
const FALLBACK: WhatsNewPost[] = [...WHATS_NEW_POSTS].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);

export function useWhatsNewFeed(): WhatsNewPost[] {
  const [posts, setPosts] = useState<WhatsNewPost[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetchPublishedFeed().then((fetched) => {
      if (!cancelled && fetched.length > 0) {
        // Keep fallback entries that do not exist in DB so local announcements
        // remain visible if DB content is incomplete.
        const fetchedIds = new Set(fetched.map((p) => p.id));
        const merged = [...fetched, ...FALLBACK.filter((p) => !fetchedIds.has(p.id))]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setPosts(merged);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return posts;
}
