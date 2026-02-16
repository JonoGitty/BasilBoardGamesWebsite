import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

interface ProfileRow {
  display_name: string;
  avatar_icon: string;
  accent_color: string;
  reduced_motion: boolean;
  analytics_opt_out: boolean;
  role: string;
  updated_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    nickname: row.display_name,
    avatarIcon: row.avatar_icon,
    accentColor: row.accent_color,
    reducedMotion: row.reduced_motion,
    analyticsOptOut: row.analytics_opt_out,
    role: row.role === 'admin' ? 'admin' : 'user',
  };
}

function toRow(profile: Profile): Omit<ProfileRow, 'updated_at' | 'role'> {
  return {
    display_name: profile.nickname,
    avatar_icon: profile.avatarIcon,
    accent_color: profile.accentColor,
    reduced_motion: profile.reducedMotion,
    analytics_opt_out: profile.analyticsOptOut,
  };
}

export async function fetchCloudProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_icon, accent_color, reduced_motion, analytics_opt_out, role, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return toProfile(data as ProfileRow);
}

export async function upsertCloudProfile(userId: string, profile: Profile): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('profiles')
    .upsert({ id: userId, ...toRow(profile), updated_at: new Date().toISOString() });
}

// Exported for testing
export { toProfile, toRow };
