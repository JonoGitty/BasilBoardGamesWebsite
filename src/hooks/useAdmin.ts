import { useAuth } from '../auth/AuthContext';
import type { Profile } from '../types/profile';

/** Returns whether the current user is an admin. UI convenience only — backend command auth is the true guard. */
export function useAdmin(profile: Profile): { isAdmin: boolean; loading: boolean } {
  const { user, loading } = useAuth();

  if (loading) return { isAdmin: false, loading: true };
  if (!user) return { isAdmin: false, loading: false };

  return { isAdmin: profile.role === 'admin', loading: false };
}
