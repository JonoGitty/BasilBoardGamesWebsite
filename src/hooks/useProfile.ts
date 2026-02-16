import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_PROFILE } from '../types/profile';
import type { Profile } from '../types/profile';

const STORAGE_KEY = 'basil_profile';

export function useProfile() {
  const [profile, setProfile] = useLocalStorage<Profile>(STORAGE_KEY, DEFAULT_PROFILE);

  const update = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => ({ ...prev, ...patch }));
    },
    [setProfile],
  );

  const reset = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, [setProfile]);

  // Apply accent color as CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', profile.accentColor);
    // Derive hover shade (lighten by mixing with white)
    document.documentElement.style.setProperty('--accent-hover', profile.accentColor + 'cc');
  }, [profile.accentColor]);

  // Apply reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', profile.reducedMotion);
  }, [profile.reducedMotion]);

  return { profile, update, reset };
}
