import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { canonicalizeNickname } from '../utils/nickname';

const DEBOUNCE_MS = 400;

/**
 * Debounced uniqueness check via the `is_nickname_taken` RPC.
 * Skips the check when the nickname is empty or unchanged from the saved value.
 */
export function useNicknameCheck(
  draft: string,
  savedNickname: string,
): { checking: boolean; taken: boolean } {
  const [checking, setChecking] = useState(false);
  const [taken, setTaken] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const canonical = canonicalizeNickname(draft);
    const savedCanonical = canonicalizeNickname(savedNickname);

    // Nothing to check
    if (!canonical || canonical === savedCanonical) {
      setTaken(false);
      setChecking(false);
      return;
    }

    setChecking(true);

    timer.current = setTimeout(async () => {
      if (!supabase) {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_nickname_taken', {
        candidate: draft,
      });

      if (!error && typeof data === 'boolean') {
        setTaken(data);
      }
      setChecking(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer.current);
  }, [draft, savedNickname]);

  return { checking, taken };
}
