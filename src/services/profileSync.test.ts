import { describe, it, expect } from 'vitest';
import { toProfile, toRow } from './profileSync';

describe('profileSync mapping', () => {
  const profile = {
    nickname: 'TestPlayer',
    avatarIcon: '\u{1F451}',
    accentColor: '#60a5fa',
    reducedMotion: true,
    analyticsOptOut: false,
  };

  const row = {
    display_name: 'TestPlayer',
    avatar_icon: '\u{1F451}',
    accent_color: '#60a5fa',
    reduced_motion: true,
    analytics_opt_out: false,
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('toProfile maps snake_case row to camelCase Profile', () => {
    const result = toProfile(row);
    expect(result).toEqual(profile);
  });

  it('toRow maps camelCase Profile to snake_case row (without updated_at)', () => {
    const result = toRow(profile);
    expect(result).toEqual({
      display_name: 'TestPlayer',
      avatar_icon: '\u{1F451}',
      accent_color: '#60a5fa',
      reduced_motion: true,
      analytics_opt_out: false,
    });
  });

  it('round-trips correctly', () => {
    const roundTripped = toProfile({ ...toRow(profile), updated_at: '2026-01-01T00:00:00Z' });
    expect(roundTripped).toEqual(profile);
  });
});
