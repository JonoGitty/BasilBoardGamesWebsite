export type PostCategory = 'patch' | 'experiment' | 'announcement';

export interface WhatsNewPost {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: PostCategory;
  publishedAt: string; // ISO 8601 date string
}
