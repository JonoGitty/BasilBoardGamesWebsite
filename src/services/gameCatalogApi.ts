import { supabase } from '../lib/supabase';
import { GAMES } from '../data/games';
import type { Game, GameStatus } from '../types/game';

interface GameRow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  url: string | null;
  pinned: boolean;
  vault: boolean;
  enabled: boolean;
  status: GameStatus;
  sort_order: number;
}

/** Derive a display badge from the game status. */
function badgeFromStatus(status: GameStatus): string | undefined {
  switch (status) {
    case 'beta':
      return 'beta';
    case 'prototype':
      return 'prototype';
    default:
      return undefined;
  }
}

/**
 * Lookup for code-defined fields that should override DB values.
 * URLs use import.meta.env.BASE_URL and env var resolution, so they
 * must always come from the hardcoded manifest, not from Supabase.
 */
const codeOverrides: Record<string, Pick<Game, 'url' | 'onlineUrl'>> = Object.fromEntries(
  GAMES.filter((g) => g.url || g.onlineUrl).map((g) => [
    g.id,
    { url: g.url, onlineUrl: g.onlineUrl },
  ]),
);

function toGame(row: GameRow): Game {
  const overrides = codeOverrides[row.id];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    url: overrides?.url ?? row.url ?? undefined,
    onlineUrl: overrides?.onlineUrl,
    status: row.status,
    badge: badgeFromStatus(row.status),
    sortOrder: row.sort_order,
  };
}

/**
 * Fetch the visible game lineup from Supabase.
 * Only returns games where enabled=true AND vault=false.
 * Ordered by sort_order then created_at.
 * Falls back to the hardcoded GAMES array if Supabase is unavailable.
 */
export async function fetchActiveGames(): Promise<Game[]> {
  if (!supabase) {
    return GAMES;
  }

  const { data, error } = await supabase
    .from('games')
    .select('id, title, description, emoji, url, pinned, vault, enabled, status, sort_order')
    .eq('vault', false)
    .eq('enabled', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return GAMES;
  }

  return (data as GameRow[]).map(toGame);
}

// Exported for testing
export { toGame, badgeFromStatus };
