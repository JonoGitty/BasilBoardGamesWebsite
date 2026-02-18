export type GameStatus = 'prototype' | 'beta' | 'polished' | 'live';

export interface Game {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: GameStatus;
  /** External URL. If set, launch opens a new tab instead of internal route. */
  url?: string;
  /** Secondary online URL. When both url and onlineUrl are set, the launcher offers a mode choice. */
  onlineUrl?: string;
  badge?: string;
  sortOrder: number;
}
