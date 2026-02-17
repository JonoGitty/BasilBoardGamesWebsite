import { useState, useEffect } from 'react';
import { GAMES } from '../data/games';
import { fetchActiveGames } from '../services/gameCatalogApi';
import type { Game } from '../types/game';

const MAX_FEATURED = 4;
const ALLOWED_IDS = ['elam', 'interrogate', 'almost', 'sidequests'];

/** Filter and reorder games to match the approved allowlist. */
function filterAllowed(list: Game[]): Game[] {
  return ALLOWED_IDS
    .map((id) => list.find((g) => g.id === id))
    .filter((g): g is Game => g != null)
    .slice(0, MAX_FEATURED);
}

/** Hardcoded fallback — displayed instantly before Supabase responds. */
const FALLBACK: Game[] = filterAllowed(GAMES);

export function useFeaturedGames(): Game[] {
  const [games, setGames] = useState<Game[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetchActiveGames().then((active) => {
      if (!cancelled && active.length > 0) {
        setGames(filterAllowed(active));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return games;
}
