import { describe, it, expect } from 'vitest';
import { toGame, badgeFromStatus } from './gameCatalogApi';

describe('gameCatalogApi mapping', () => {
  it('maps a live game row to Game with live status', () => {
    const row = {
      id: 'almost',
      title: 'Almost',
      description: 'A game of near misses.',
      emoji: '\u{1F3AF}',
      url: null,
      pinned: false,
      vault: false,
      enabled: true,
      status: 'live' as const,
      sort_order: 3,
    };
    const game = toGame(row);
    expect(game).toEqual({
      id: 'almost',
      title: 'Almost',
      description: 'A game of near misses.',
      emoji: '\u{1F3AF}',
      url: undefined,
      status: 'live',
      badge: undefined,
      sortOrder: 3,
    });
  });

  it('maps a beta game row with beta badge', () => {
    const row = {
      id: 'test',
      title: 'Test',
      description: 'Testing.',
      emoji: '\u{1F9EA}',
      url: null,
      pinned: false,
      vault: false,
      enabled: true,
      status: 'beta' as const,
      sort_order: 1,
    };
    const game = toGame(row);
    expect(game.status).toBe('beta');
    expect(game.badge).toBe('beta');
  });

  it('preserves url when present', () => {
    const row = {
      id: 'ext',
      title: 'External',
      description: 'Hosted elsewhere.',
      emoji: '\u{1F517}',
      url: 'https://example.com',
      pinned: false,
      vault: false,
      enabled: true,
      status: 'live' as const,
      sort_order: 0,
    };
    expect(toGame(row).url).toBe('https://example.com');
  });
});

describe('badgeFromStatus', () => {
  it('returns "beta" for beta status', () => {
    expect(badgeFromStatus('beta')).toBe('beta');
  });

  it('returns "prototype" for prototype status', () => {
    expect(badgeFromStatus('prototype')).toBe('prototype');
  });

  it('returns undefined for live status', () => {
    expect(badgeFromStatus('live')).toBeUndefined();
  });

  it('returns undefined for polished status', () => {
    expect(badgeFromStatus('polished')).toBeUndefined();
  });
});
