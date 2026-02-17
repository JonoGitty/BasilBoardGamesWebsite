import { describe, it, expect } from 'vitest';
import { toProfile, toRow } from './profileSync';

describe('profileSync mapping', () => {
  const profile = {
    nickname: 'TestPlayer',
    avatarIcon: '\u{1F451}',
    accentColor: '#60a5fa',
    reducedMotion: true,
    analyticsOptOut: false,
    role: 'user' as const,
    launcherStyle: 'craft-desk' as const,
  };

  const row = {
    display_name: 'TestPlayer',
    avatar_icon: '\u{1F451}',
    accent_color: '#60a5fa',
    reduced_motion: true,
    analytics_opt_out: false,
    role: 'user',
    launcher_style: 'craft-desk',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('toProfile maps snake_case row to camelCase Profile', () => {
    const result = toProfile(row);
    expect(result).toEqual(profile);
  });

  it('toRow maps camelCase Profile to snake_case row (without updated_at or role)', () => {
    const result = toRow(profile);
    expect(result).toEqual({
      display_name: 'TestPlayer',
      avatar_icon: '\u{1F451}',
      accent_color: '#60a5fa',
      reduced_motion: true,
      analytics_opt_out: false,
      launcher_style: 'craft-desk',
    });
  });

  it('round-trips correctly', () => {
    const roundTripped = toProfile({ ...toRow(profile), role: 'user', updated_at: '2026-01-01T00:00:00Z' });
    expect(roundTripped).toEqual(profile);
  });

  it('toProfile maps admin role from row', () => {
    const adminRow = { ...row, role: 'admin' };
    expect(toProfile(adminRow).role).toBe('admin');
  });

  it('toRow excludes role from output', () => {
    const adminProfile = { ...profile, role: 'admin' as const };
    const result = toRow(adminProfile);
    expect('role' in result).toBe(false);
  });
});
