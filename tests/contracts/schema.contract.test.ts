import { describe, it, expect } from 'vitest';
import type { AdminGameRow, PostRow, FeedbackRow, AdminCommandName } from '../../src/types/admin';
import type { Profile } from '../../src/types/profile';
import type { MetricsSnapshot } from '../../src/types/metrics';
import type { PostCategory } from '../../src/types/whatsNew';
import {
  makeFeedbackRow,
  makeGameRow,
  makePostRow,
  makeProfile,
  makeMetricsSnapshot,
} from '../../src/test/fixtures/supabase-rows';

// These contract tests validate that our TypeScript types and fixture factories
// produce objects with the shapes we expect from the database schema.
// They guard against silent drift between TS types and the SQL migrations.

describe('schema contract tests', () => {
  describe('FeedbackRow', () => {
    it('has all required columns from 014_feedback.sql', () => {
      const row: FeedbackRow = makeFeedbackRow();
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('created_at');
      expect(row).toHaveProperty('game_id');
      expect(row).toHaveProperty('page');
      expect(row).toHaveProperty('source');
      expect(row).toHaveProperty('feedback_text');
      expect(row).toHaveProperty('context_json');
      expect(row).toHaveProperty('client_feedback_id');
      expect(row).toHaveProperty('ip_hash');
      expect(row).toHaveProperty('status');
      expect(row).toHaveProperty('admin_note');
    });

    it('status is constrained to new | reviewed | resolved | dismissed', () => {
      const validStatuses: FeedbackRow['status'][] = ['new', 'reviewed', 'resolved', 'dismissed'];
      for (const status of validStatuses) {
        const row = makeFeedbackRow({ status });
        expect(row.status).toBe(status);
      }
    });

    it('ip_hash column is nullable', () => {
      const withNull = makeFeedbackRow({ ip_hash: null });
      expect(withNull.ip_hash).toBeNull();

      const withValue = makeFeedbackRow({ ip_hash: 'abc123' });
      expect(withValue.ip_hash).toBe('abc123');
    });

    it('context_json column holds a Record<string, unknown>', () => {
      const row = makeFeedbackRow({ context_json: { browser: 'Chrome', version: 120 } });
      expect(typeof row.context_json).toBe('object');
      expect(row.context_json).not.toBeNull();
      expect(Array.isArray(row.context_json)).toBe(false);
    });
  });

  describe('AdminGameRow', () => {
    it('has all expected columns', () => {
      const row: AdminGameRow = makeGameRow();
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('title');
      expect(row).toHaveProperty('description');
      expect(row).toHaveProperty('emoji');
      expect(row).toHaveProperty('url');
      expect(row).toHaveProperty('pinned');
      expect(row).toHaveProperty('vault');
      expect(row).toHaveProperty('enabled');
      expect(row).toHaveProperty('status');
      expect(row).toHaveProperty('sort_order');
      expect(row).toHaveProperty('cooldown_until');
      expect(row).toHaveProperty('updated_at');
      expect(row).toHaveProperty('created_at');
    });
  });

  describe('PostRow', () => {
    it('has all expected columns including published_at', () => {
      const row: PostRow = makePostRow();
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('title');
      expect(row).toHaveProperty('description');
      expect(row).toHaveProperty('emoji');
      expect(row).toHaveProperty('category');
      expect(row).toHaveProperty('published');
      expect(row).toHaveProperty('published_at');
      expect(row).toHaveProperty('created_by');
      expect(row).toHaveProperty('updated_at');
      expect(row).toHaveProperty('created_at');
    });
  });

  describe('Profile', () => {
    it('has all expected fields', () => {
      const profile: Profile = makeProfile();
      expect(profile).toHaveProperty('nickname');
      expect(profile).toHaveProperty('avatarIcon');
      expect(profile).toHaveProperty('accentColor');
      expect(profile).toHaveProperty('reducedMotion');
      expect(profile).toHaveProperty('analyticsOptOut');
      expect(profile).toHaveProperty('role');
      expect(profile).toHaveProperty('launcherStyle');
    });
  });

  describe('MetricsSnapshot', () => {
    it('has expected structure', () => {
      const snap: MetricsSnapshot = makeMetricsSnapshot();
      expect(snap).toHaveProperty('dau');
      expect(snap).toHaveProperty('wau');
      expect(snap).toHaveProperty('retention_d1');
      expect(snap).toHaveProperty('retention_d7');
      expect(snap).toHaveProperty('sessions');
      expect(snap).toHaveProperty('top_games');
      expect(snap).toHaveProperty('computed_at');

      expect(Array.isArray(snap.dau)).toBe(true);
      expect(Array.isArray(snap.wau)).toBe(true);
      expect(typeof snap.retention_d1).toBe('number');
      expect(typeof snap.sessions.avg_ms).toBe('number');
      expect(typeof snap.sessions.median_ms).toBe('number');
      expect(typeof snap.sessions.total_sessions).toBe('number');
      expect(Array.isArray(snap.top_games)).toBe(true);
    });
  });

  describe('AdminCommandName', () => {
    it('includes all 8 command names', () => {
      // Compile-time check: every literal is assignable to AdminCommandName.
      const commands: AdminCommandName[] = [
        'games.patch',
        'games.set_active_lineup',
        'posts.upsert_draft',
        'posts.patch',
        'posts.set_published',
        'posts.delete',
        'site.set_launcher_style',
        'feedback.update_status',
      ];
      expect(commands).toHaveLength(8);
    });
  });

  describe('PostCategory', () => {
    it('includes all 3 categories', () => {
      // Compile-time check: every literal is assignable to PostCategory.
      const categories: PostCategory[] = ['patch', 'experiment', 'announcement'];
      expect(categories).toHaveLength(3);
    });
  });
});
