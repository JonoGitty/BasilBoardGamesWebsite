import { useState, useEffect } from 'react';
import { GAMES } from '../data/games';
import { fetchActiveGames } from '../services/gameCatalogApi';
import type { Game } from '../types/game';

const MAX_FEATURED = 4;
const ALLOWED_IDS = ['elam', 'interrogate', 'almost', 'sidequests'];

/** Local manifest lookup keyed by id. */
const LOCAL_BY_ID = new Map(GAMES.map((g) => [g.id, g]));

/**
 * Build the featured list from the allowlist.
 * Remote data is merged on top of local entries so Supabase can update
 * titles/descriptions, but missing games still appear from the manifest.
 */
function buildFeatured(remote: Game[]): Game[] {
  const remoteById = new Map(remote.map((g) => [g.id, g]));

  return ALLOWED_IDS
    .map((id) => {
      const local = LOCAL_BY_ID.get(id);
      const fetched = remoteById.get(id);
      if (!local) return null;
      // Merge: remote wins for most fields, but keep local url if remote lacks one
      return fetched ? { ...fetched, url: fetched.url ?? local.url } : local;
    })
    .filter((g): g is Game => g != null)
    .slice(0, MAX_FEATURED);
}

/** Hardcoded fallback — displayed instantly before Supabase responds. */
const FALLBACK: Game[] = buildFeatured([]);

export function useFeaturedGames(): Game[] {
  const [games, setGames] = useState<Game[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetchActiveGames().then((active) => {
      if (!cancelled) {
        setGames(buildFeatured(active));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return games;
}
