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
  auth_sign_up: { method: string };
  auth_sign_in: { method: string };
  auth_sign_out: Record<string, never>;
  admin_open: Record<string, never>;
  admin_game_update: { gameId: string; fields: string[] };
  admin_post_create: { postId: string };
  admin_post_publish: { postId: string };
  admin_post_unpublish: { postId: string };
  admin_post_delete: { postId: string };
}

export type EventName = keyof EventMap;

export interface TelemetryEvent<K extends EventName = EventName> {
  id: string;
  name: K;
  payload: EventMap[K];
  timestamp: number;
}
