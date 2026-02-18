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

export const AVATAR_ICONS = [
  '\u{1F3B2}', // dice
  '\u{1F0CF}', // joker
  '\u{1F3AF}', // target
  '\u{1F9E9}', // puzzle
  '\u{1F451}', // crown
  '\u{1F525}', // fire
  '\u{2B50}',  // star
  '\u{1F30A}', // wave
];

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
  avatarIcon: '\u{1F3B2}',
  accentColor: '#7c6ff7',
  reducedMotion: false,
  analyticsOptOut: false,
  role: 'user',
  launcherStyle: 'craft-desk',
};
