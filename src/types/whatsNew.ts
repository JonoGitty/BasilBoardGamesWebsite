export type PostCategory = 'patch' | 'experiment' | 'announcement';

export interface WhatsNewPost {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: PostCategory;
  publishedAt: string; // ISO 8601 date string
}

/** Admin editing type — includes draft/publish state and audit fields. */
export interface AdminPost {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: PostCategory;
  published: boolean;
  publishedAt: string | null;
  createdBy: string | null;
  updatedAt: string;
  createdAt: string;
}
