import { useState, useEffect, useCallback } from 'react';
import { fetchAllGames, updateGame } from '../services/adminApi';
import type { AdminGameRow, GameUpdatePayload } from '../types/admin';

export function useAdminGames() {
  const [games, setGames] = useState<AdminGameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchAllGames();
    setGames(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllGames().then((data) => {
      if (!cancelled) {
        setGames(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const update = useCallback(
    async (gameId: string, payload: GameUpdatePayload) => {
      // Optimistic update
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, ...payload } : g)),
      );
      setError(null);

      const result = await updateGame(gameId, payload);
      if (!result.ok) {
        setError(result.error ?? 'Update failed');
        await refresh(); // Revert on failure
      }
      return result;
    },
    [refresh],
  );

  return { games, loading, error, update, refresh };
}
