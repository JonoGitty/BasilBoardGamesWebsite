import { useState, useEffect, useCallback } from 'react';
import { fetchAllGames, updateGame, setActiveLineup as apiSetActiveLineup } from '../services/adminApi';
import type { AdminGameRow, GameUpdatePayload } from '../types/admin';

export function useAdminGames() {
  const [games, setGames] = useState<AdminGameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Snapshot of vault state from last server fetch, for dirty detection. */
  const [serverGames, setServerGames] = useState<AdminGameRow[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchAllGames();
    setGames(data);
    setServerGames(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllGames().then((data) => {
      if (!cancelled) {
        setGames(data);
        setServerGames(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  /** Toggle local vault/pinned state (optimistic, no server call). */
  const toggleLocal = useCallback(
    (gameId: string, field: 'vault' | 'pinned', value: boolean) => {
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, [field]: value } : g)),
      );
    },
    [],
  );

  /** Patch a single game field (e.g. pinned) via command. */
  const update = useCallback(
    async (gameId: string, payload: GameUpdatePayload) => {
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, ...payload } : g)),
      );
      setError(null);

      const result = await updateGame(gameId, payload);
      if (!result.ok) {
        setError(result.error ?? 'Update failed');
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  /** Apply current active (non-vaulted) games as the lineup via one command. */
  const applyLineup = useCallback(async () => {
    const activeIds = games.filter((g) => !g.vault).map((g) => g.id);
    if (activeIds.length === 0) {
      setError('At least one game must be active');
      return { ok: false, error: 'At least one game must be active' };
    }

    setSaving(true);
    setError(null);
    const result = await apiSetActiveLineup(activeIds);
    if (!result.ok) {
      setError(result.error ?? 'Failed to apply lineup');
      await refresh();
    } else {
      setServerGames(games);
    }
    setSaving(false);
    return result;
  }, [games, refresh]);

  /** Whether the local vault state differs from the last server state. */
  const lineupDirty = games.some((g) => {
    const server = serverGames.find((s) => s.id === g.id);
    return server ? server.vault !== g.vault : false;
  });

  return { games, loading, saving, error, lineupDirty, toggleLocal, update, applyLineup, refresh };
}
