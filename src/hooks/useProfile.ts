import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '../auth/AuthContext';
import { DEFAULT_PROFILE } from '../types/profile';
import { fetchCloudProfile, upsertCloudProfile } from '../services/profileSync';
import type { Profile } from '../types/profile';

const STORAGE_KEY = 'basil_profile';

export function useProfile() {
  const [stored, setProfile] = useLocalStorage<Profile>(STORAGE_KEY, DEFAULT_PROFILE);
  const profile = { ...DEFAULT_PROFILE, ...stored };
  const { user } = useAuth();
  const hasSynced = useRef(false);

  // Cloud sync: pull on first authenticated load
  useEffect(() => {
    if (!user || hasSynced.current) return;
    hasSynced.current = true;

    fetchCloudProfile(user.id).then((cloud) => {
      if (cloud) {
        setProfile(cloud);
      } else {
        // First login — push local profile to cloud
        upsertCloudProfile(user.id, profile);
      }
    });
    // Only run when user changes, not on profile changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reset sync flag when user changes (sign-out then sign-in as someone else)
  useEffect(() => {
    if (!user) hasSynced.current = false;
  }, [user]);

  const update = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        if (user) upsertCloudProfile(user.id, next);
        return next;
      });
    },
    [setProfile, user],
  );

  const reset = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    if (user) upsertCloudProfile(user.id, DEFAULT_PROFILE);
  }, [setProfile, user]);

  // Apply accent color as CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', profile.accentColor);
    document.documentElement.style.setProperty('--accent-hover', profile.accentColor + 'cc');
  }, [profile.accentColor]);

  // Apply reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', profile.reducedMotion);
  }, [profile.reducedMotion]);

  // Apply dashboard-wide theme
  useEffect(() => {
    if (profile.launcherStyle === 'craft-desk') {
      document.documentElement.setAttribute('data-theme', 'craft-desk');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [profile.launcherStyle]);

  return { profile, update, reset };
}
