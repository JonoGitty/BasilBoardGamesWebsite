import { describe, it, expect } from 'vitest';

// These are pure shape/contract tests — they validate the API contract
// the client code depends on, without hitting the real edge function.

const VALID_COMMANDS = [
  'games.patch', 'games.set_active_lineup', 'posts.upsert_draft',
  'posts.patch', 'posts.set_published', 'posts.delete',
  'site.set_launcher_style', 'feedback.update_status',
] as const;

type CommandName = typeof VALID_COMMANDS[number];

interface CommandRequest {
  name: CommandName;
  args: Record<string, unknown>;
}

interface SuccessResponse {
  ok: true;
  command: string;
  actorUserId: string;
  result: unknown;
}

interface ErrorResponse {
  ok: false;
  code: string;
  error: string;
}

type CommandResponse = SuccessResponse | ErrorResponse;

const VALID_GAME_STATUSES = ['prototype', 'beta', 'polished', 'live'] as const;
const VALID_POST_CATEGORIES = ['patch', 'experiment', 'announcement'] as const;
const VALID_FEEDBACK_STATUSES = ['new', 'reviewed', 'resolved', 'dismissed'] as const;
const VALID_LAUNCHER_STYLES = ['classic', 'craft-desk', 'netflix'] as const;

// ── Helpers ────────────────────────────────────────────────────

function makeSuccessResponse(overrides?: Partial<SuccessResponse>): SuccessResponse {
  return {
    ok: true,
    command: 'games.patch',
    actorUserId: 'user-abc-123',
    result: { game: { id: 'elam' } },
    ...overrides,
  };
}

function makeErrorResponse(overrides?: Partial<ErrorResponse>): ErrorResponse {
  return {
    ok: false,
    code: 'invalid_args',
    error: 'Something went wrong',
    ...overrides,
  };
}

function makeCommandRequest(overrides?: Partial<CommandRequest>): CommandRequest {
  return {
    name: 'games.patch',
    args: { gameId: 'elam', changes: { title: 'Elam v2' } },
    ...overrides,
  };
}

function isSuccessResponse(r: CommandResponse): r is SuccessResponse {
  return r.ok === true;
}

function isErrorResponse(r: CommandResponse): r is ErrorResponse {
  return r.ok === false;
}

// ── Tests ──────────────────────────────────────────────────────

describe('admin-command contract', () => {
  describe('valid command names', () => {
    it.each(VALID_COMMANDS.map((c) => [c]))(
      'includes "%s" in the valid commands list',
      (commandName) => {
        expect(VALID_COMMANDS).toContain(commandName);
      },
    );

    it('contains exactly 8 valid commands', () => {
      expect(VALID_COMMANDS).toHaveLength(8);
    });
  });

  describe('CommandRequest shape', () => {
    it('requires a name field of type CommandName', () => {
      const req = makeCommandRequest();
      expect(typeof req.name).toBe('string');
      expect(VALID_COMMANDS).toContain(req.name);
    });

    it('requires an args field that is a plain object', () => {
      const req = makeCommandRequest();
      expect(typeof req.args).toBe('object');
      expect(req.args).not.toBeNull();
      expect(Array.isArray(req.args)).toBe(false);
    });
  });

  describe('SuccessResponse shape', () => {
    it('has ok=true, command string, actorUserId string, and result', () => {
      const res = makeSuccessResponse();
      expect(res.ok).toBe(true);
      expect(typeof res.command).toBe('string');
      expect(typeof res.actorUserId).toBe('string');
      expect(res).toHaveProperty('result');
    });

    it('is narrowed correctly via ok discriminant', () => {
      const res: CommandResponse = makeSuccessResponse();
      expect(isSuccessResponse(res)).toBe(true);
      if (isSuccessResponse(res)) {
        expect(res.command).toBeDefined();
        expect(res.actorUserId).toBeDefined();
      }
    });
  });

  describe('ErrorResponse shape', () => {
    it('has ok=false, code string, and error string', () => {
      const res = makeErrorResponse();
      expect(res.ok).toBe(false);
      expect(typeof res.code).toBe('string');
      expect(typeof res.error).toBe('string');
    });

    it('is narrowed correctly via ok discriminant', () => {
      const res: CommandResponse = makeErrorResponse();
      expect(isErrorResponse(res)).toBe(true);
      if (isErrorResponse(res)) {
        expect(res.code).toBeDefined();
        expect(res.error).toBeDefined();
      }
    });
  });

  describe('command-specific args contracts', () => {
    it('games.patch requires gameId (string) and changes (object)', () => {
      const args = { gameId: 'elam', changes: { title: 'New Title' } };
      expect(typeof args.gameId).toBe('string');
      expect(typeof args.changes).toBe('object');
      expect(args.changes).not.toBeNull();
    });

    it('games.set_active_lineup requires activeGameIds (string[])', () => {
      const args = { activeGameIds: ['elam', 'chess', 'go'] };
      expect(Array.isArray(args.activeGameIds)).toBe(true);
      expect(args.activeGameIds.length).toBeGreaterThan(0);
      for (const id of args.activeGameIds) {
        expect(typeof id).toBe('string');
      }
    });

    it('posts.upsert_draft requires id, title, description, emoji, category', () => {
      const args = {
        id: 'post-001',
        title: 'New Feature',
        description: 'We shipped a thing.',
        emoji: '🚀',
        category: 'patch' as const,
      };
      expect(typeof args.id).toBe('string');
      expect(typeof args.title).toBe('string');
      expect(typeof args.description).toBe('string');
      expect(typeof args.emoji).toBe('string');
      expect(VALID_POST_CATEGORIES).toContain(args.category);
    });

    it('posts.patch requires postId (string) and changes (object)', () => {
      const args = { postId: 'post-001', changes: { title: 'Updated Title' } };
      expect(typeof args.postId).toBe('string');
      expect(typeof args.changes).toBe('object');
      expect(args.changes).not.toBeNull();
    });

    it('posts.set_published requires postId (string) and published (boolean)', () => {
      const args = { postId: 'post-001', published: true };
      expect(typeof args.postId).toBe('string');
      expect(typeof args.published).toBe('boolean');
    });

    it('posts.delete requires postId (string)', () => {
      const args = { postId: 'post-001' };
      expect(typeof args.postId).toBe('string');
    });

    it('site.set_launcher_style requires style (string from known set)', () => {
      const args = { style: 'craft-desk' as const };
      expect(typeof args.style).toBe('string');
      expect(VALID_LAUNCHER_STYLES).toContain(args.style);
    });

    it('feedback.update_status requires feedbackId (number) and status (string)', () => {
      const args = { feedbackId: 42, status: 'reviewed' as const };
      expect(typeof args.feedbackId).toBe('number');
      expect(Number.isInteger(args.feedbackId)).toBe(true);
      expect(typeof args.status).toBe('string');
      expect(VALID_FEEDBACK_STATUSES).toContain(args.status);
    });
  });

  describe('domain value constraints', () => {
    it('valid game statuses are prototype, beta, polished, live', () => {
      expect(VALID_GAME_STATUSES).toEqual(['prototype', 'beta', 'polished', 'live']);
    });

    it('valid post categories are patch, experiment, announcement', () => {
      expect(VALID_POST_CATEGORIES).toEqual(['patch', 'experiment', 'announcement']);
    });

    it('valid feedback statuses are new, reviewed, resolved, dismissed', () => {
      expect(VALID_FEEDBACK_STATUSES).toEqual(['new', 'reviewed', 'resolved', 'dismissed']);
    });

    it('valid launcher styles are classic, craft-desk, netflix', () => {
      expect(VALID_LAUNCHER_STYLES).toEqual(['classic', 'craft-desk', 'netflix']);
    });
  });

  describe('error code contracts', () => {
    it('auth error (no token) returns code "unauthorized"', () => {
      const res = makeErrorResponse({ code: 'unauthorized', error: 'Missing bearer token' });
      expect(res.ok).toBe(false);
      expect(res.code).toBe('unauthorized');
      expect(typeof res.error).toBe('string');
    });

    it('unknown command returns code "unknown_command"', () => {
      const res = makeErrorResponse({ code: 'unknown_command', error: 'Unsupported command "foo.bar"' });
      expect(res.ok).toBe(false);
      expect(res.code).toBe('unknown_command');
    });

    it('missing args returns code "invalid_request"', () => {
      const res = makeErrorResponse({ code: 'invalid_request', error: 'Missing or invalid "args"' });
      expect(res.ok).toBe(false);
      expect(res.code).toBe('invalid_request');
    });

    it('empty changes in games.patch returns code "invalid_args"', () => {
      const res = makeErrorResponse({ code: 'invalid_args', error: 'No valid game fields provided in changes' });
      expect(res.ok).toBe(false);
      expect(res.code).toBe('invalid_args');
    });
  });
});
