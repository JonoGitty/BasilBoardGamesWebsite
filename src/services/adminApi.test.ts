import { describe, it, expect } from 'vitest';
import { toAdminPost, updateGame, setActiveLineup, updateFeedbackStatus } from './adminApi';

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

describe('adminApi client-side validation', () => {
  it('updateGame rejects empty payload', async () => {
    const result = await updateGame('some-game', {});
    expect(result.ok).toBe(false);
    expect(result.error).toBe('No changes provided');
  });

  it('setActiveLineup rejects empty array', async () => {
    const result = await setActiveLineup([]);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('At least one game is required');
  });
});

describe('updateFeedbackStatus client-side validation', () => {
  it('rejects invalid feedback ID (zero)', async () => {
    const result = await updateFeedbackStatus(0, 'reviewed');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid feedback ID');
  });

  it('rejects invalid feedback ID (negative)', async () => {
    const result = await updateFeedbackStatus(-1, 'resolved');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid feedback ID');
  });

  it('rejects invalid feedback ID (non-integer)', async () => {
    const result = await updateFeedbackStatus(1.5, 'dismissed');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid feedback ID');
  });

  it('rejects invalid status value', async () => {
    const result = await updateFeedbackStatus(1, 'bogus');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid status');
    expect(result.error).toContain('bogus');
  });

  it('accepts valid status values without client-side rejection', async () => {
    // These will fail at the Supabase layer (not configured), but should pass validation
    for (const status of ['new', 'reviewed', 'resolved', 'dismissed']) {
      const result = await updateFeedbackStatus(1, status);
      // Should not be a validation error — it will be a Supabase config error
      expect(result.error).not.toContain('Invalid status');
      expect(result.error).not.toContain('Invalid feedback ID');
    }
  });
});
