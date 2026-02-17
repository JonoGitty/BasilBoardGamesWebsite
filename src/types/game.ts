export type GameStatus = 'prototype' | 'beta' | 'polished' | 'live';

export interface Game {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: GameStatus;
  /** External URL. If set, launch opens a new tab instead of internal route. */
  url?: string;
  badge?: string;
  sortOrder: number;
}
