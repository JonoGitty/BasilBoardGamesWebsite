export interface GameSession {
  id: string;
  gameId: string;
  startedAt: number; // Unix ms
  endedAt: number | null;
}

export interface SessionSummary {
  gameId: string;
  durationMs: number;
  startedAt: number;
  endedAt: number;
}
