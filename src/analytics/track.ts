import type { EventMap, EventName, TelemetryEvent } from './schema';
import { enqueue, drain, size } from './queue';

const PROFILE_KEY = 'basil_profile';

/**
 * Check opt-out directly from localStorage so the analytics module
 * stays decoupled from React state.
 */
function isOptedOut(): boolean {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return false;
    const profile = JSON.parse(raw);
    return profile.analyticsOptOut === true;
  } catch {
    return false;
  }
}

/**
 * Track a telemetry event. Silently drops the event if the user
 * has opted out of analytics.
 */
export function track<K extends EventName>(
  name: K,
  payload: EventMap[K],
): void {
  if (isOptedOut()) return;

  const event: TelemetryEvent<K> = {
    name,
    payload,
    timestamp: Date.now(),
  };

  enqueue(event);
}

/**
 * Drain all queued events. Intended for a future transport layer
 * that ships events to a backend.
 */
export function flushEvents(): TelemetryEvent[] {
  return drain();
}

/**
 * Number of events currently queued.
 */
export function queueSize(): number {
  return size();
}
