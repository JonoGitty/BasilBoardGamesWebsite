export type LauncherStyle = 'classic' | 'craft-desk' | 'netflix' | 'nebula';

export const LAUNCHER_STYLES: { label: string; value: LauncherStyle }[] = [
  { label: 'Craft Desk', value: 'craft-desk' },
  { label: 'Nebula Tiles', value: 'nebula' },
  { label: 'Netflix Tiles', value: 'netflix' },
  { label: 'Classic (Fanned Cards)', value: 'classic' },
];

export interface Profile {
  nickname: string;
  avatarIcon: string;
  accentColor: string;
  reducedMotion: boolean;
  analyticsOptOut: boolean;
  role: 'user' | 'admin';
  launcherStyle: LauncherStyle;
}

/** Privacy policy version string (e.g. "2026-02-18"). Bump on policy changes. */
export const CURRENT_PRIVACY_POLICY_VERSION = '2026-02-18';

export const DEFAULT_AVATAR_ICON = '\u{1F3B2}';
export const CROWN_AVATAR_ICON = '\u{1F451}';

export const AVATAR_ICONS = [
  DEFAULT_AVATAR_ICON, // dice
  '\u{1F0CF}', // joker
  '\u{1F3AF}', // target
  '\u{1F9E9}', // puzzle
  CROWN_AVATAR_ICON, // crown
  '\u{1F525}', // fire
  '\u{2B50}',  // star
  '\u{1F30A}', // wave
];

export function getAvatarIconsForRole(role: Profile['role']): string[] {
  if (role === 'admin') return AVATAR_ICONS;
  return AVATAR_ICONS.filter((icon) => icon !== CROWN_AVATAR_ICON);
}

export function sanitizeAvatarIconForRole(
  avatarIcon: string,
  role: Profile['role'],
): string {
  if (role !== 'admin' && avatarIcon === CROWN_AVATAR_ICON) {
    return DEFAULT_AVATAR_ICON;
  }
  return avatarIcon;
}

export function sanitizeProfileForRole(profile: Profile): Profile {
  return {
    ...profile,
    avatarIcon: sanitizeAvatarIconForRole(profile.avatarIcon, profile.role),
  };
}

export const ACCENT_COLORS = [
  { label: 'Violet', value: '#7c6ff7' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Teal', value: '#2dd4bf' },
  { label: 'Green', value: '#34d399' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Rose', value: '#fb7185' },
];

export const DEFAULT_PROFILE: Profile = {
  nickname: 'Player',
  avatarIcon: DEFAULT_AVATAR_ICON,
  accentColor: '#7c6ff7',
  reducedMotion: false,
  analyticsOptOut: false,
  role: 'user',
  launcherStyle: 'craft-desk',
};
