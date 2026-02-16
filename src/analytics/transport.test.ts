import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { TelemetryEvent } from './schema';

// Stub env before any module loads
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');

// Mock supabase module
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

function makeEvent(name = 'app_open'): TelemetryEvent {
  return {
    id: crypto.randomUUID(),
    name: name as TelemetryEvent['name'],
    payload: {},
    timestamp: Date.now(),
  };
}

describe('sendEvents', () => {
  let sendEvents: typeof import('./transport').sendEvents;

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    globalThis.fetch = vi.fn();
    // Dynamic import so mocks are in place
    const mod = await import('./transport');
    sendEvents = mod.sendEvents;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends POST to edge function URL', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('{"inserted":1}', { status: 200 }),
    );

    await sendEvents([makeEvent()]);

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://test.supabase.co/functions/v1/events-ingest');
    expect(opts.method).toBe('POST');
  });

  it('does not call fetch for empty array', async () => {
    await sendEvents([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('retries on 500', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(new Response('{"inserted":1}', { status: 200 }));

    await sendEvents([makeEvent()]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 400', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response('bad', { status: 400 }));

    await sendEvents([makeEvent()]);

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
