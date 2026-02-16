import type { GameSession, SessionSummary } from '../types/session';

const STORAGE_KEY = 'basil_sessions';
const ACTIVE_KEY = 'basil_active_session';

let activeSession: GameSession | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a new session for a game. Ends any existing session first. */
export function startSession(gameId: string): GameSession {
  if (activeSession) {
    endSession();
  }

  activeSession = {
    id: generateId(),
    gameId,
    startedAt: Date.now(),
    endedAt: null,
  };

  try {
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(activeSession));
  } catch { /* storage full — non-critical */ }

  return activeSession;
}

/** End the current session and persist it. Returns summary or null if no active session. */
export function endSession(): SessionSummary | null {
  if (!activeSession) {
    // Try to recover from sessionStorage (e.g. after page reload)
    try {
      const raw = sessionStorage.getItem(ACTIVE_KEY);
      if (raw) activeSession = JSON.parse(raw);
    } catch { /* ignore */ }
  }

  if (!activeSession) return null;

  const endedAt = Date.now();
  const summary: SessionSummary = {
    gameId: activeSession.gameId,
    durationMs: endedAt - activeSession.startedAt,
    startedAt: activeSession.startedAt,
    endedAt,
  };

  // Persist to localStorage log
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SessionSummary[];
    existing.push(summary);
    // Keep last 50 sessions
    const trimmed = existing.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* storage full — non-critical */ }

  // Clean up
  activeSession = null;
  try {
    sessionStorage.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }

  return summary;
}

/** Get the currently active session, if any. */
export function getActiveSession(): GameSession | null {
  return activeSession;
}

/** Get all persisted session summaries. */
export function getSessionHistory(): SessionSummary[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
