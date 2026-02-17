import type { EventMap, EventName, TelemetryEvent } from './schema';
import { enqueue, drain, size } from './queue';
import { sendEvents } from './transport';
import { hasAnalyticsConsent } from '../lib/consent';

const PROFILE_KEY = 'basil_profile';
const FLUSH_INTERVAL_MS = 30_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

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
  if (!hasAnalyticsConsent() || isOptedOut()) return;

  const event: TelemetryEvent<K> = {
    id: crypto.randomUUID(),
    name,
    payload,
    timestamp: Date.now(),
  };

  enqueue(event);
}

/**
 * Drain all queued events and return them.
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

async function autoFlush(): Promise<void> {
  const events = flushEvents();
  if (events.length === 0) return;
  await sendEvents(events);
}

/**
 * Start the auto-flush transport. Call once at app startup.
 * Sets up a 30-second periodic flush and a beforeunload flush.
 */
export function initTransport(): void {
  if (intervalId !== null) return;
  intervalId = setInterval(() => void autoFlush(), FLUSH_INTERVAL_MS);
  window.addEventListener('beforeunload', () => void autoFlush());
}

/**
 * Stop the auto-flush transport. Useful for test teardown.
 */
export function stopTransport(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
