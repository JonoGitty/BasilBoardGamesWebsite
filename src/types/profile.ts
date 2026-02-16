export interface Profile {
  nickname: string;
  avatarIcon: string;
  accentColor: string;
  reducedMotion: boolean;
  analyticsOptOut: boolean;
  role: 'user' | 'admin';
}

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
};
