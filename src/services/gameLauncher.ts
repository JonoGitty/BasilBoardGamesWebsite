import type { Game } from '../types/game';
import { startSession } from './sessionTracker';
import { track } from '../analytics/track';

export type LaunchResult =
  | { mode: 'internal'; gameId: string }
  | { mode: 'external'; gameId: string }
  | { mode: 'choose'; game: Game };

/**
 * Launch a game. If both url and onlineUrl are set, returns a 'choose'
 * result so the UI can show a mode selector. External URLs open in a
 * new tab; internal games return a result the UI uses to show the game view.
 * A session is started in both cases (deferred for 'choose' until selection).
 */
export function launchGame(game: Game): LaunchResult {
  if (game.url && game.onlineUrl) {
    return { mode: 'choose', game };
  }

  startSession(game.id);

  if (game.url) {
    window.open(game.url, '_blank', 'noopener');
    track('game_start', { gameId: game.id, launchMode: 'external' });
    return { mode: 'external', gameId: game.id };
  }

  track('game_start', { gameId: game.id, launchMode: 'internal' });
  return { mode: 'internal', gameId: game.id };
}

/**
 * Launch a specific mode after the user has chosen from the mode selector.
 */
export function launchGameMode(game: Game, mode: 'local' | 'online'): void {
  startSession(game.id);
  const url = mode === 'online' ? game.onlineUrl : game.url;
  if (url) {
    window.open(url, '_blank', 'noopener');
  }
  track('game_start', { gameId: game.id, launchMode: 'external' });
}
