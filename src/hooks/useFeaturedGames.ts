import { useState, useEffect } from 'react';
import { GAMES } from '../data/games';
import { fetchActiveGames } from '../services/gameCatalogApi';
import type { Game } from '../types/game';

/**
 * Returns the visible game list for the launcher.
 *
 * Fetches from Supabase (enabled=true, vault=false, ordered by sort_order).
 * Falls back to the hardcoded manifest when Supabase is unavailable.
 *
 * All launcher skins consume this same list — no skin-specific filtering.
 */
export function useFeaturedGames(): Game[] {
  const [games, setGames] = useState<Game[]>(GAMES);

  useEffect(() => {
    let cancelled = false;

    fetchActiveGames().then((active) => {
      if (!cancelled) {
        setGames(active);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return games;
}
