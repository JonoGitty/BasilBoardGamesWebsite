import { describe, it, expect } from 'vitest';
import type { MetricsSnapshot } from '../types/metrics';

describe('MetricsSnapshot type', () => {
  it('accepts a valid snapshot shape', () => {
    const snapshot: MetricsSnapshot = {
      dau: [{ day: '2025-02-15', users: 42 }],
      wau: [{ week: '2025-W07', users: 150 }],
      retention_d1: 35.5,
      retention_d7: 18.2,
      sessions: { avg_ms: 120_000, median_ms: 90_000, total_sessions: 500 },
      top_games: [
        { game_id: 'catan', sessions: 100, avg_duration_ms: 180_000 },
      ],
      computed_at: '2025-02-15T12:00:00Z',
    };

    expect(snapshot.dau).toHaveLength(1);
    expect(snapshot.retention_d1).toBeGreaterThanOrEqual(0);
    expect(snapshot.sessions.total_sessions).toBe(500);
    expect(snapshot.top_games[0].game_id).toBe('catan');
    expect(snapshot.computed_at).toBeTruthy();
  });

  it('handles empty arrays', () => {
    const snapshot: MetricsSnapshot = {
      dau: [],
      wau: [],
      retention_d1: 0,
      retention_d7: 0,
      sessions: { avg_ms: 0, median_ms: 0, total_sessions: 0 },
      top_games: [],
      computed_at: '2025-02-15T00:00:00Z',
    };

    expect(snapshot.dau).toHaveLength(0);
    expect(snapshot.top_games).toHaveLength(0);
  });
});
