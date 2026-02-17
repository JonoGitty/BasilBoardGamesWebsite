export interface Game {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: 'active' | 'coming_soon' | 'archived';
  /** External URL. If set, launch opens a new tab instead of internal route. */
  url?: string;
  badge?: 'new' | 'beta';
}
