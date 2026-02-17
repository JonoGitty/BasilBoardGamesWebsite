import { describe, it, expect } from 'vitest';
import { GAMES } from './games';

const REQUIRED_IDS = ['elam', 'interrogate', 'almost', 'sidequests'];

describe('games manifest', () => {
  it('has exactly 4 active games', () => {
    const active = GAMES.filter((g) => g.status === 'active');
    expect(active).toHaveLength(4);
  });

  it('active IDs match the approved lineup in exact order', () => {
    const activeIds = GAMES.filter((g) => g.status === 'active').map((g) => g.id);
    expect(activeIds).toEqual(REQUIRED_IDS);
  });

  it('interrogate has a url pointing to the static bundle', () => {
    const interrogate = GAMES.find((g) => g.id === 'interrogate');
    expect(interrogate).toBeDefined();
    expect(interrogate!.url).toContain('games/interrogate/index.html');
  });

  it('all games have required fields', () => {
    for (const game of GAMES) {
      expect(game.id).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.description).toBeTruthy();
      expect(game.emoji).toBeTruthy();
      expect(['active', 'coming_soon', 'archived']).toContain(game.status);
    }
  });

  it('has no duplicate IDs', () => {
    const ids = GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
