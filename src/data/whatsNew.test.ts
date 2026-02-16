import { describe, it, expect } from 'vitest';
import { WHATS_NEW_POSTS } from './whatsNew';

describe('whatsNew manifest', () => {
  it('has at least one post', () => {
    expect(WHATS_NEW_POSTS.length).toBeGreaterThan(0);
  });

  it('all posts have valid categories', () => {
    for (const post of WHATS_NEW_POSTS) {
      expect(['patch', 'experiment', 'announcement']).toContain(post.category);
    }
  });

  it('all posts have valid ISO date strings', () => {
    for (const post of WHATS_NEW_POSTS) {
      const d = new Date(post.publishedAt);
      expect(d.getTime()).not.toBeNaN();
    }
  });

  it('has no duplicate IDs', () => {
    const ids = WHATS_NEW_POSTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
