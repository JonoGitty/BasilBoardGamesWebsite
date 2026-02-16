import { describe, it, expect } from 'vitest';
import { toWhatsNewPost } from './postsFeedApi';

describe('postsFeedApi mapping', () => {
  it('maps a PostFeedRow to WhatsNewPost', () => {
    const row = {
      id: 'feed-post',
      title: 'Feed Post',
      description: 'Visible to everyone.',
      emoji: '\u{1F4E3}',
      category: 'announcement',
      published_at: '2026-02-15T00:00:00Z',
    };

    const post = toWhatsNewPost(row);
    expect(post).toEqual({
      id: 'feed-post',
      title: 'Feed Post',
      description: 'Visible to everyone.',
      emoji: '\u{1F4E3}',
      category: 'announcement',
      publishedAt: '2026-02-15T00:00:00Z',
    });
  });
});
