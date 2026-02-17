import { useState, useEffect, useCallback } from 'react';
import { fetchAllGames, updateGame, setActiveLineup as apiSetActiveLineup } from '../services/adminApi';
import type { AdminGameRow, GameUpdatePayload } from '../types/admin';

/** Fields tracked for dirty detection (lineup bar). */
const LINEUP_FIELDS: (keyof AdminGameRow)[] = ['vault'];

export function useAdminGames() {
  const [games, setGames] = useState<AdminGameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Snapshot of state from last server fetch, for dirty detection. */
  const [serverGames, setServerGames] = useState<AdminGameRow[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAllGames();
    if (result.error) setError(result.error);
    setGames(result.data);
    setServerGames(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllGames().then((result) => {
      if (!cancelled) {
        if (result.error) setError(result.error);
        setGames(result.data);
        setServerGames(result.data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  /** Toggle local boolean state (optimistic, no server call). */
  const toggleLocal = useCallback(
    (gameId: string, field: 'vault' | 'pinned' | 'enabled', value: boolean) => {
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, [field]: value } : g)),
      );
    },
    [],
  );

  /** Update a local field (optimistic, no server call). */
  const setLocalField = useCallback(
    (gameId: string, field: keyof AdminGameRow, value: unknown) => {
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, [field]: value } : g)),
      );
    },
    [],
  );

  /** Patch a single game field via command (persists immediately). */
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
      } else {
        // Sync server snapshot for the updated game
        setServerGames((prev) =>
          prev.map((g) => (g.id === gameId ? { ...g, ...payload } : g)),
        );
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

  /** Whether the local lineup/visibility state differs from the last server state. */
  const lineupDirty = games.some((g) => {
    const server = serverGames.find((s) => s.id === g.id);
    if (!server) return false;
    return LINEUP_FIELDS.some((f) => server[f] !== g[f]);
  });

  return { games, loading, saving, error, lineupDirty, toggleLocal, setLocalField, update, applyLineup, refresh };
}
