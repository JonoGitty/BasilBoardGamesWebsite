import { describe, it, expect } from 'vitest';
import { GAMES } from './games';

const REQUIRED_IDS = ['elam', 'interrogate', 'almost', 'sidequests'];
const VALID_STATUSES = ['prototype', 'beta', 'polished', 'live'];

describe('games manifest', () => {
  it('has exactly 4 games', () => {
    expect(GAMES).toHaveLength(4);
  });

  it('IDs match the approved lineup in exact order', () => {
    const ids = GAMES.map((g) => g.id);
    expect(ids).toEqual(REQUIRED_IDS);
  });

  it('interrogate has a url pointing to the static bundle', () => {
    const interrogate = GAMES.find((g) => g.id === 'interrogate');
    expect(interrogate).toBeDefined();
    expect(interrogate!.url).toContain('games/interrogate/index.html');
  });

  it('elam has a url pointing to the external service', () => {
    const elam = GAMES.find((g) => g.id === 'elam');
    expect(elam).toBeDefined();
    expect(elam!.url).toMatch(/^https?:\/\//);
  });

  it('all games have required fields', () => {
    for (const game of GAMES) {
      expect(game.id).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.description).toBeTruthy();
      expect(game.emoji).toBeTruthy();
      expect(VALID_STATUSES).toContain(game.status);
      expect(typeof game.sortOrder).toBe('number');
    }
  });

  it('has no duplicate IDs', () => {
    const ids = GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
