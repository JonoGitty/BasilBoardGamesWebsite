import type { TelemetryEvent } from './schema';
import { enqueue } from './queue';
import { supabase } from '../lib/supabase';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

function getIngestUrl(): string | null {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!projectUrl) return null;
  return `${projectUrl}/functions/v1/events-ingest`;
}

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function sendEvents(events: TelemetryEvent[]): Promise<void> {
  if (events.length === 0) return;

  const url = getIngestUrl();
  if (!url) {
    for (const e of events) enqueue(e);
    return;
  }

  const token = await getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = JSON.stringify({ events });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });

      if (res.ok) return;

      // 4xx (except 429) are not retryable
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        console.warn(`[analytics] ingest rejected (${res.status}), dropping batch`);
        return;
      }
    } catch {
      // Network error — retry
    }

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // All retries exhausted — re-enqueue for next flush
  console.warn('[analytics] ingest failed after retries, re-enqueueing');
  for (const e of events) enqueue(e);
}
