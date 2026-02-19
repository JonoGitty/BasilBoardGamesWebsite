import { describe, it, expect } from 'vitest';
import type { WhatsNewPost } from '../types/whatsNew';
import { resolveWhatsNewFeed } from './useWhatsNewFeed';

const fallback: WhatsNewPost[] = [
  {
    id: 'fallback-a',
    title: 'Fallback A',
    description: 'Fallback entry',
    emoji: 'A',
    category: 'announcement',
    publishedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'fallback-b',
    title: 'Fallback B',
    description: 'Fallback entry',
    emoji: 'B',
    category: 'patch',
    publishedAt: '2026-02-09T00:00:00Z',
  },
];

describe('resolveWhatsNewFeed', () => {
  it('keeps fallback when fetch is unavailable', () => {
    const result = resolveWhatsNewFeed(null, fallback);
    expect(result.map((p) => p.id)).toEqual(['fallback-a', 'fallback-b']);
  });

  it('uses fetched feed as authoritative when fetch succeeds', () => {
    const fetched: WhatsNewPost[] = [
      {
        id: 'db-1',
        title: 'DB One',
        description: 'Published row',
        emoji: '1',
        category: 'announcement',
        publishedAt: '2026-02-11T00:00:00Z',
      },
    ];

    const result = resolveWhatsNewFeed(fetched, fallback);
    expect(result.map((p) => p.id)).toEqual(['db-1']);
  });

  it('returns fetched posts sorted newest first', () => {
    const fetched: WhatsNewPost[] = [
      {
        id: 'older',
        title: 'Older',
        description: 'Older post',
        emoji: 'O',
        category: 'patch',
        publishedAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'newer',
        title: 'Newer',
        description: 'Newer post',
        emoji: 'N',
        category: 'announcement',
        publishedAt: '2026-02-12T00:00:00Z',
      },
    ];

    const result = resolveWhatsNewFeed(fetched, fallback);
    expect(result.map((p) => p.id)).toEqual(['newer', 'older']);
  });
});

