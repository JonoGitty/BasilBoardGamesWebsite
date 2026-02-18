export interface FeedbackParams {
  feedback: string;
  page?: string;
  source?: string;
  gameId?: string;
  context?: Record<string, unknown>;
}

export interface FeedbackReceipt {
  ok: boolean;
  receiptId?: string;
  acceptedAt?: string;
  duplicate?: boolean;
  error?: string;
}

function makeClientFeedbackId(): string {
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getIngestUrl(): string | null {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!projectUrl) return null;
  return `${projectUrl}/functions/v1/feedback-ingest`;
}

export async function submitFeedback(params: FeedbackParams): Promise<FeedbackReceipt> {
  const feedback = (params.feedback ?? '').trim().slice(0, 500);
  if (!feedback) return { ok: false, error: 'Feedback cannot be empty' };

  const url = getIngestUrl();
  if (!url) return { ok: false, error: 'Supabase not configured' };

  const body: Record<string, unknown> = {
    clientFeedbackId: makeClientFeedbackId(),
    feedback,
    page: (params.page ?? 'hub').slice(0, 32),
    source: (params.source ?? 'ui').slice(0, 32),
  };
  if (params.gameId) body.gameId = params.gameId.slice(0, 80);
  if (params.context) body.context = params.context;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: data?.error ?? `Request failed (${res.status})` };
    }

    return {
      ok: true,
      receiptId: data.receiptId,
      acceptedAt: data.acceptedAt,
      duplicate: data.duplicate ?? false,
    };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
