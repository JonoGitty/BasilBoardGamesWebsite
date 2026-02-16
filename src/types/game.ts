export interface Game {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: 'active' | 'coming_soon' | 'archived';
}
