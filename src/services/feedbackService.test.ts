import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Stub env before any module loads
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');

describe('submitFeedback', () => {
  let submitFeedback: typeof import('./feedbackService').submitFeedback;

  beforeEach(async () => {
    globalThis.fetch = vi.fn();
    const mod = await import('./feedbackService');
    submitFeedback = mod.submitFeedback;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST to feedback-ingest URL', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, receiptId: '42', acceptedAt: '2026-01-01T00:00:00Z' }), { status: 201 }),
    );

    const result = await submitFeedback({ feedback: 'Great game!' });

    expect(result.ok).toBe(true);
    expect(result.receiptId).toBe('42');
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://test.supabase.co/functions/v1/feedback-ingest');
    expect(opts.method).toBe('POST');
  });

  it('returns ok: false for empty feedback', async () => {
    const result = await submitFeedback({ feedback: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('empty');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns ok: false for whitespace-only feedback', async () => {
    const result = await submitFeedback({ feedback: '   ' });
    expect(result.ok).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('truncates feedback to 500 chars', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, receiptId: '1' }), { status: 201 }),
    );

    const longText = 'x'.repeat(600);
    await submitFeedback({ feedback: longText });

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.feedback.length).toBe(500);
  });

  it('returns ok: false on network error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network failure'));

    const result = await submitFeedback({ feedback: 'test' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('includes gameId when provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, receiptId: '2' }), { status: 201 }),
    );

    await submitFeedback({ feedback: 'Nice!', gameId: 'elam' });

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.gameId).toBe('elam');
  });

  it('omits gameId when not provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, receiptId: '3' }), { status: 201 }),
    );

    await submitFeedback({ feedback: 'Hello' });

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.gameId).toBeUndefined();
  });

  it('returns error message from server response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 }),
    );

    const result = await submitFeedback({ feedback: 'test' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Rate limit exceeded');
  });
});
