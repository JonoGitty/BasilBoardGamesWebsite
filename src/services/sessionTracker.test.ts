import { describe, it, expect, beforeEach } from 'vitest';
import { startSession, endSession, getActiveSession, getSessionHistory } from './sessionTracker';

beforeEach(() => {
  // End any lingering session (writes to storage), then clear storage
  endSession();
  localStorage.clear();
  sessionStorage.clear();
});

describe('sessionTracker', () => {
  it('starts a session and returns it', () => {
    const session = startSession('almost');
    expect(session.gameId).toBe('almost');
    expect(session.startedAt).toBeGreaterThan(0);
    expect(session.endedAt).toBeNull();
  });

  it('getActiveSession returns the current session', () => {
    startSession('elam');
    const active = getActiveSession();
    expect(active).not.toBeNull();
    expect(active!.gameId).toBe('elam');
  });

  it('endSession returns a summary with positive duration', () => {
    startSession('interrogate');
    const summary = endSession();
    expect(summary).not.toBeNull();
    expect(summary!.gameId).toBe('interrogate');
    expect(summary!.durationMs).toBeGreaterThanOrEqual(0);
    expect(summary!.endedAt).toBeGreaterThanOrEqual(summary!.startedAt);
  });

  it('endSession without start returns null', () => {
    const summary = endSession();
    expect(summary).toBeNull();
  });

  it('starting a new session ends the previous one', () => {
    startSession('almost');
    startSession('elam');
    const active = getActiveSession();
    expect(active!.gameId).toBe('elam');

    // Previous session should have been persisted
    const history = getSessionHistory();
    expect(history.length).toBe(1);
    expect(history[0].gameId).toBe('almost');
  });

  it('persists session history to localStorage', () => {
    startSession('hex-havoc');
    endSession();
    startSession('tall-tales');
    endSession();

    const history = getSessionHistory();
    expect(history.length).toBe(2);
    expect(history[0].gameId).toBe('hex-havoc');
    expect(history[1].gameId).toBe('tall-tales');
  });
});
