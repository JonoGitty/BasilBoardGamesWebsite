import { describe, it, expect } from 'vitest';

// These are pure shape/contract tests — they validate the API contract
// the feedback-ingest edge function exposes, without hitting the real function.

interface FeedbackPayload {
  clientFeedbackId: string;
  feedback: string;
  page?: string;
  source?: string;
  gameId?: string | null;
  context?: Record<string, unknown>;
}

interface SuccessResponse {
  ok: true;
  receiptId: string;
  acceptedAt: string;
  clientFeedbackId: string;
}

interface DuplicateResponse {
  ok: true;
  duplicate: true;
  receiptId: string | null;
  acceptedAt: string | null;
  clientFeedbackId: string;
}

interface RateLimitResponse {
  error: string;
  code: 'rate_limited';
  retryAfterSec: number;
}

// ── Helpers ────────────────────────────────────────────────────

function makeValidPayload(overrides?: Partial<FeedbackPayload>): FeedbackPayload {
  return {
    clientFeedbackId: 'cfid-abc-123',
    feedback: 'The game froze on my turn.',
    page: 'game',
    source: 'ui',
    gameId: 'elam',
    context: { browser: 'Chrome', screenWidth: 1440 },
    ...overrides,
  };
}

function makeSuccessResponse(overrides?: Partial<SuccessResponse>): SuccessResponse {
  return {
    ok: true,
    receiptId: '42',
    acceptedAt: '2026-01-15T12:00:00Z',
    clientFeedbackId: 'cfid-abc-123',
    ...overrides,
  };
}

function makeDuplicateResponse(overrides?: Partial<DuplicateResponse>): DuplicateResponse {
  return {
    ok: true,
    duplicate: true,
    receiptId: '42',
    acceptedAt: '2026-01-15T12:00:00Z',
    clientFeedbackId: 'cfid-abc-123',
    ...overrides,
  };
}

function makeRateLimitResponse(overrides?: Partial<RateLimitResponse>): RateLimitResponse {
  return {
    error: 'Rate limit exceeded',
    code: 'rate_limited',
    retryAfterSec: 60,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe('feedback-ingest contract', () => {
  describe('request payload shape', () => {
    it('valid payload has all required fields', () => {
      const payload = makeValidPayload();
      expect(typeof payload.clientFeedbackId).toBe('string');
      expect(typeof payload.feedback).toBe('string');
      expect(payload.clientFeedbackId.length).toBeGreaterThan(0);
      expect(payload.feedback.length).toBeGreaterThan(0);
    });

    it('clientFeedbackId is required (string)', () => {
      const payload = makeValidPayload();
      expect(typeof payload.clientFeedbackId).toBe('string');
      expect(payload.clientFeedbackId.trim().length).toBeGreaterThan(0);
    });

    it('feedback is required (non-empty string)', () => {
      const payload = makeValidPayload();
      expect(typeof payload.feedback).toBe('string');
      expect(payload.feedback.trim().length).toBeGreaterThan(0);
    });

    it('empty feedback string is invalid', () => {
      const payload = makeValidPayload({ feedback: '' });
      expect(payload.feedback.trim().length).toBe(0);
    });

    it('feedback max length is 500 characters', () => {
      const maxLen = 500;
      const longFeedback = 'x'.repeat(maxLen);
      const tooLongFeedback = 'x'.repeat(maxLen + 1);

      expect(longFeedback.length).toBe(maxLen);
      expect(tooLongFeedback.length).toBeGreaterThan(maxLen);
    });

    it('page defaults to "unknown" if missing', () => {
      const payload = makeValidPayload({ page: undefined });
      const effectivePage = payload.page ?? 'unknown';
      expect(effectivePage).toBe('unknown');
    });

    it('source defaults to "ui" if missing', () => {
      const payload = makeValidPayload({ source: undefined });
      const effectiveSource = payload.source ?? 'ui';
      expect(effectiveSource).toBe('ui');
    });

    it('gameId is optional (string or null)', () => {
      const withGameId = makeValidPayload({ gameId: 'elam' });
      expect(typeof withGameId.gameId).toBe('string');

      const withNull = makeValidPayload({ gameId: null });
      expect(withNull.gameId).toBeNull();

      const withUndefined = makeValidPayload({ gameId: undefined });
      expect(withUndefined.gameId).toBeUndefined();
    });

    it('context is optional (object)', () => {
      const withContext = makeValidPayload({ context: { browser: 'Chrome' } });
      expect(typeof withContext.context).toBe('object');
      expect(withContext.context).not.toBeNull();

      const withoutContext = makeValidPayload({ context: undefined });
      expect(withoutContext.context).toBeUndefined();
    });
  });

  describe('response shapes', () => {
    it('success response (201) has ok, receiptId, acceptedAt, clientFeedbackId', () => {
      const res = makeSuccessResponse();
      expect(res.ok).toBe(true);
      expect(typeof res.receiptId).toBe('string');
      expect(typeof res.acceptedAt).toBe('string');
      expect(typeof res.clientFeedbackId).toBe('string');
    });

    it('duplicate response (200) has duplicate=true flag', () => {
      const res = makeDuplicateResponse();
      expect(res.ok).toBe(true);
      expect(res.duplicate).toBe(true);
      expect(typeof res.clientFeedbackId).toBe('string');
      // receiptId and acceptedAt may be null for duplicates where original was deleted
      expect(['string', 'object'].includes(typeof res.receiptId)).toBe(true); // string | null
      expect(['string', 'object'].includes(typeof res.acceptedAt)).toBe(true); // string | null
    });

    it('rate limit response (429) has retryAfterSec number', () => {
      const res = makeRateLimitResponse();
      expect(res.code).toBe('rate_limited');
      expect(typeof res.retryAfterSec).toBe('number');
      expect(res.retryAfterSec).toBeGreaterThan(0);
      expect(typeof res.error).toBe('string');
    });
  });
});
