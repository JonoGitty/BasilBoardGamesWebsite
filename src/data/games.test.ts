import { describe, it, expect } from 'vitest';
import { GAMES } from './games';

describe('games manifest', () => {
  it('has at least 4 active games', () => {
    const active = GAMES.filter((g) => g.status === 'active');
    expect(active.length).toBeGreaterThanOrEqual(4);
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
