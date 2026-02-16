import { useState, useCallback } from 'react';

/**
 * useState backed by localStorage. Reads on mount, writes on every update.
 */
export function useLocalStorage<T>(key: string, fallback: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  const set = useCallback(
    (val: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch { /* storage full — non-critical */ }
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
