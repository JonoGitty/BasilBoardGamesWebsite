import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [result, setResult] = useState<{ checking: boolean; taken: boolean }>({
    checking: false,
    taken: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const aborted = useRef(false);

  const shouldCheck = useMemo(() => {
    const canonical = canonicalizeNickname(draft);
    const savedCanonical = canonicalizeNickname(savedNickname);
    return !!canonical && canonical !== savedCanonical;
  }, [draft, savedNickname]);

  useEffect(() => {
    if (!shouldCheck) return;

    aborted.current = false;

    timer.current = setTimeout(async () => {
      if (!supabase || aborted.current) return;

      const { data, error } = await supabase.rpc('is_nickname_taken', {
        candidate: draft,
      });

      if (aborted.current) return;
      if (!error && typeof data === 'boolean') {
        setResult({ checking: false, taken: data });
      } else {
        setResult({ checking: false, taken: false });
      }
    }, DEBOUNCE_MS);

    return () => {
      aborted.current = true;
      clearTimeout(timer.current);
    };
  }, [draft, shouldCheck]);

  if (!shouldCheck) {
    return { checking: false, taken: false };
  }

  return result.checking ? result : { checking: true, taken: false };
}
