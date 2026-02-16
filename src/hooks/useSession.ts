import { useEffect, useCallback, useRef } from 'react';
import { endSession } from '../services/sessionTracker';
import type { SessionSummary } from '../types/session';

/**
 * Manages the lifecycle of the current game session.
 * Automatically ends the session on unmount or tab close.
 * Returns `endCurrentSession` for explicit end-of-game.
 */
export function useSession(gameId: string | null) {
  const lastSummary = useRef<SessionSummary | null>(null);

  const endCurrentSession = useCallback(() => {
    const summary = endSession();
    if (summary) lastSummary.current = summary;
    return summary;
  }, []);

  // Best-effort: end session on beforeunload (tab close / navigate away)
  useEffect(() => {
    if (!gameId) return;

    const handleUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Also end on unmount (user navigated back in-app)
      endSession();
    };
  }, [gameId]);

  return { endCurrentSession, lastSummary: lastSummary.current };
}
