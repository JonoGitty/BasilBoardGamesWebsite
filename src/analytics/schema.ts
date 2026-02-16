/**
 * Telemetry event map. Keys are event names, values are their payloads.
 * Payloads must never include PII (no nickname, email, etc.).
 */
export interface EventMap {
  app_open: Record<string, never>;
  card_click: { gameId: string };
  game_start: { gameId: string; launchMode: 'internal' | 'external' };
  game_end: { gameId: string; durationMs: number };
  whats_new_expand: Record<string, never>;
  settings_change: { field: string };
}

export type EventName = keyof EventMap;

export interface TelemetryEvent<K extends EventName = EventName> {
  name: K;
  payload: EventMap[K];
  timestamp: number;
}
