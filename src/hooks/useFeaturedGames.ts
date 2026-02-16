import { useMemo } from 'react';
import { GAMES } from '../data/games';
import type { Game } from '../types/game';

const MAX_FEATURED = 6;

export function useFeaturedGames(): Game[] {
  return useMemo(
    () => GAMES.filter((g) => g.status === 'active').slice(0, MAX_FEATURED),
    [],
  );
}
