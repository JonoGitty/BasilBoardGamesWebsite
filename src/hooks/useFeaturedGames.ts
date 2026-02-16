import { useState, useEffect } from 'react';
import { GAMES } from '../data/games';
import { fetchActiveGames } from '../services/gameCatalogApi';
import type { Game } from '../types/game';

const MAX_FEATURED = 6;

/** Hardcoded fallback — displayed instantly before Supabase responds. */
const FALLBACK: Game[] = GAMES.filter((g) => g.status === 'active').slice(0, MAX_FEATURED);

export function useFeaturedGames(): Game[] {
  const [games, setGames] = useState<Game[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetchActiveGames().then((active) => {
      if (!cancelled && active.length > 0) {
        setGames(active.slice(0, MAX_FEATURED));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return games;
}
