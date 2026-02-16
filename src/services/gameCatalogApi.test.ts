import { describe, it, expect } from 'vitest';
import { toGame } from './gameCatalogApi';

describe('gameCatalogApi mapping', () => {
  it('maps an active game row to Game with active status', () => {
    const row = {
      id: 'almost',
      title: 'Almost',
      description: 'A game of near misses.',
      emoji: '🎯',
      url: null,
      pinned: false,
      vault: false,
    };
    const game = toGame(row);
    expect(game).toEqual({
      id: 'almost',
      title: 'Almost',
      description: 'A game of near misses.',
      emoji: '🎯',
      url: undefined,
      status: 'active',
    });
  });

  it('maps a vault game to coming_soon status', () => {
    const row = {
      id: 'deep-six',
      title: 'Deep Six',
      description: 'Ocean exploration.',
      emoji: '🌊',
      url: null,
      pinned: false,
      vault: true,
    };
    expect(toGame(row).status).toBe('coming_soon');
  });

  it('preserves url when present', () => {
    const row = {
      id: 'ext',
      title: 'External',
      description: 'Hosted elsewhere.',
      emoji: '🔗',
      url: 'https://example.com',
      pinned: false,
      vault: false,
    };
    expect(toGame(row).url).toBe('https://example.com');
  });
});
