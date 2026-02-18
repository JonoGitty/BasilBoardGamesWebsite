-- 016_friendly_announcement.sql
-- Add a general, friendly "What's New" announcement post.

INSERT INTO public.posts (id, title, description, emoji, category, published, published_at)
VALUES (
  'ann-thanks-for-feedback',
  'Thanks for Playing',
  'Thank you for playing and sending feedback. We are making steady improvements across the site to keep things smooth, clear, and fun.',
  '👋',
  'announcement',
  true,
  '2026-02-18T00:00:00Z'
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  category = EXCLUDED.category,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();
