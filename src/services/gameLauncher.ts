import type { Game } from '../types/game';
import { startSession } from './sessionTracker';

export type LaunchResult =
  | { mode: 'internal'; gameId: string }
  | { mode: 'external'; gameId: string };

/**
 * Launch a game. External URLs open in a new tab; internal games
 * return a result the UI uses to show the game view.
 * A session is started in both cases.
 */
export function launchGame(game: Game): LaunchResult {
  startSession(game.id);

  if (game.url) {
    window.open(game.url, '_blank', 'noopener');
    return { mode: 'external', gameId: game.id };
  }

  return { mode: 'internal', gameId: game.id };
}
