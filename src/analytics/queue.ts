import type { TelemetryEvent, EventName } from './schema';

const STORAGE_KEY = 'basil_telemetry_queue';
const MAX_QUEUE = 200;

/** In-memory buffer — flushed to localStorage periodically. */
let buffer: TelemetryEvent[] = [];

/** Enqueue an event. */
export function enqueue<K extends EventName>(event: TelemetryEvent<K>): void {
  buffer.push(event);

  // Persist on every write for MVP (cheap enough at this scale)
  persist();
}

/** Read all queued events (memory + storage). */
export function drain(): TelemetryEvent[] {
  const stored = loadFromStorage();
  const all = [...stored, ...buffer];
  buffer = [];
  clearStorage();
  return all;
}

/** Peek at current queue size. */
export function size(): number {
  return loadFromStorage().length + buffer.length;
}

/** Flush memory buffer into localStorage. */
function persist(): void {
  try {
    const stored = loadFromStorage();
    const merged = [...stored, ...buffer].slice(-MAX_QUEUE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    buffer = [];
  } catch { /* storage full — drop silently */ }
}

function loadFromStorage(): TelemetryEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
