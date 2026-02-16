export interface DauEntry {
  day: string;
  users: number;
}

export interface WauEntry {
  week: string;
  users: number;
}

export interface SessionStats {
  avg_ms: number;
  median_ms: number;
  total_sessions: number;
}

export interface TopGameEntry {
  game_id: string;
  sessions: number;
  avg_duration_ms: number;
}

export interface MetricsSnapshot {
  dau: DauEntry[];
  wau: WauEntry[];
  retention_d1: number;
  retention_d7: number;
  sessions: SessionStats;
  top_games: TopGameEntry[];
  computed_at: string;
}
