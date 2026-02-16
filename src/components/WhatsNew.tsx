import { useMemo, useState } from 'react';
import { WHATS_NEW_POSTS } from '../data/whatsNew';
import WhatsNewItem from './WhatsNewItem';

const PREVIEW_COUNT = 3;

export default function WhatsNew() {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () =>
      [...WHATS_NEW_POSTS].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [],
  );

  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  if (sorted.length === 0) {
    return (
      <section className="whats-new" aria-label="What's new">
        <h2 className="whats-new__heading">What's New</h2>
        <p className="whats-new__empty">Nothing new yet — check back soon.</p>
      </section>
    );
  }

  return (
    <section className="whats-new" aria-label="What's new">
      <h2 className="whats-new__heading">What's New</h2>
      {visible.map((post) => (
        <WhatsNewItem key={post.id} post={post} />
      ))}
      {hasMore && (
        <button
          className="whats-new__toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `View all (${sorted.length})`}
        </button>
      )}
    </section>
  );
}
