import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';
import { sanitizeAvatarIconForRole } from '../types/profile';

interface ProfileRow {
  display_name: string;
  avatar_icon: string;
  accent_color: string;
  reduced_motion: boolean;
  analytics_opt_out: boolean;
  role: string;
  launcher_style: string;
  updated_at: string;
}

function toProfile(row: ProfileRow): Profile {
  const role = row.role === 'admin' ? 'admin' : 'user';
  return {
    nickname: row.display_name,
    avatarIcon: sanitizeAvatarIconForRole(row.avatar_icon, role),
    accentColor: row.accent_color,
    reducedMotion: row.reduced_motion,
    analyticsOptOut: row.analytics_opt_out,
    role,
    launcherStyle: (row.launcher_style as Profile['launcherStyle']) ?? 'craft-desk',
  };
}

function toRow(profile: Profile): Omit<ProfileRow, 'updated_at' | 'role'> {
  return {
    display_name: profile.nickname.trim().replace(/\s+/g, ' '),
    avatar_icon: sanitizeAvatarIconForRole(profile.avatarIcon, profile.role),
    accent_color: profile.accentColor,
    reduced_motion: profile.reducedMotion,
    analytics_opt_out: profile.analyticsOptOut,
    launcher_style: profile.launcherStyle,
  };
}

export async function fetchCloudProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_icon, accent_color, reduced_motion, analytics_opt_out, role, launcher_style, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return toProfile(data as ProfileRow);
}

export async function upsertCloudProfile(
  userId: string,
  profile: Profile,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: true };

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...toRow(profile), updated_at: new Date().toISOString() });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Exported for testing
export { toProfile, toRow };
