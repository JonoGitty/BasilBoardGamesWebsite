import type { AdminGameRow, PostRow, FeedbackRow } from '../../types/admin';
import type { Profile } from '../../types/profile';
import type { MetricsSnapshot } from '../../types/metrics';

let _seq = 0;
function uid(): string {
  _seq += 1;
  return `test-${_seq.toString(36).padStart(6, '0')}`;
}

export function makeGameRow(overrides?: Partial<AdminGameRow>): AdminGameRow {
  const id = uid();
  return {
    id,
    title: `Test Game ${id}`,
    description: 'A test game for automated testing.',
    emoji: '\u{1F3B2}',
    url: null,
    pinned: false,
    vault: false,
    enabled: true,
    status: 'live',
    sort_order: 0,
    cooldown_until: null,
    updated_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makePostRow(overrides?: Partial<PostRow>): PostRow {
  const id = uid();
  return {
    id,
    title: `Test Post ${id}`,
    description: 'A test post for automated testing.',
    emoji: '\u{1F4DD}',
    category: 'patch',
    published: false,
    published_at: null,
    created_by: null,
    updated_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeFeedbackRow(overrides?: Partial<FeedbackRow>): FeedbackRow {
  return {
    id: ++_seq,
    created_at: '2026-01-15T12:00:00Z',
    game_id: null,
    page: 'game',
    source: 'ui',
    feedback_text: 'Test feedback entry.',
    context_json: {},
    client_feedback_id: uid(),
    ip_hash: null,
    status: 'new',
    admin_note: null,
    ...overrides,
  };
}

export function makeProfile(overrides?: Partial<Profile>): Profile {
  return {
    nickname: 'TestPlayer',
    avatarIcon: '\u{1F3B2}',
    accentColor: '#7c6ff7',
    reducedMotion: false,
    analyticsOptOut: false,
    role: 'user',
    launcherStyle: 'craft-desk',
    ...overrides,
  };
}

export function makeMetricsSnapshot(overrides?: Partial<MetricsSnapshot>): MetricsSnapshot {
  return {
    dau: [{ day: '2026-01-15', users: 42 }],
    wau: [{ week: '2026-W03', users: 120 }],
    retention_d1: 0.45,
    retention_d7: 0.22,
    sessions: { avg_ms: 180_000, median_ms: 120_000, total_sessions: 500 },
    top_games: [{ game_id: 'elam', sessions: 200, avg_duration_ms: 240_000 }],
    computed_at: '2026-01-15T12:00:00Z',
    ...overrides,
  };
}

/** Reset the internal sequence counter (call in beforeEach). */
export function resetFixtureSeq(): void {
  _seq = 0;
}
