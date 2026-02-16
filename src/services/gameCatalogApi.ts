import { supabase } from '../lib/supabase';
import { GAMES } from '../data/games';
import type { Game } from '../types/game';

interface GameRow {
  id: string;
  title: string;
  description: string;
  emoji: string;
  url: string | null;
  pinned: boolean;
  vault: boolean;
}

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    url: row.url ?? undefined,
    status: row.vault ? 'coming_soon' : 'active',
  };
}

/**
 * Fetch the active game lineup from Supabase.
 * Falls back to the hardcoded GAMES array if Supabase is unavailable.
 */
export async function fetchActiveGames(): Promise<Game[]> {
  if (!supabase) {
    return GAMES.filter((g) => g.status === 'active');
  }

  const { data, error } = await supabase
    .from('games')
    .select('id, title, description, emoji, url, pinned, vault')
    .eq('vault', false);

  if (error || !data || data.length === 0) {
    return GAMES.filter((g) => g.status === 'active');
  }

  return (data as GameRow[]).map(toGame);
}

// Exported for testing
export { toGame };
