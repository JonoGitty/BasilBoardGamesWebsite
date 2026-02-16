import { describe, it, expect } from 'vitest';
import { toAdminPost } from './adminApi';

describe('adminApi mapping', () => {
  it('maps a published PostRow to AdminPost', () => {
    const row = {
      id: 'test-post',
      title: 'Test Post',
      description: 'A test post.',
      emoji: '\u{1F4DD}',
      category: 'announcement' as const,
      published: true,
      published_at: '2026-02-15T00:00:00Z',
      created_by: 'user-123',
      updated_at: '2026-02-15T12:00:00Z',
      created_at: '2026-02-14T00:00:00Z',
    };

    const post = toAdminPost(row);
    expect(post).toEqual({
      id: 'test-post',
      title: 'Test Post',
      description: 'A test post.',
      emoji: '\u{1F4DD}',
      category: 'announcement',
      published: true,
      publishedAt: '2026-02-15T00:00:00Z',
      createdBy: 'user-123',
      updatedAt: '2026-02-15T12:00:00Z',
      createdAt: '2026-02-14T00:00:00Z',
    });
  });

  it('handles null published_at and created_by for drafts', () => {
    const row = {
      id: 'draft-post',
      title: 'Draft',
      description: 'Not published.',
      emoji: '\u{270F}\uFE0F',
      category: 'patch' as const,
      published: false,
      published_at: null,
      created_by: null,
      updated_at: '2026-02-15T00:00:00Z',
      created_at: '2026-02-14T00:00:00Z',
    };

    const post = toAdminPost(row);
    expect(post.published).toBe(false);
    expect(post.publishedAt).toBeNull();
    expect(post.createdBy).toBeNull();
  });
});
