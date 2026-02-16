import type { WhatsNewPost } from '../types/whatsNew';
import { formatShortDate } from '../utils/date';

const CATEGORY_LABELS: Record<WhatsNewPost['category'], string> = {
  patch: 'Patch',
  experiment: 'Experiment',
  announcement: 'Announcement',
};

interface WhatsNewItemProps {
  post: WhatsNewPost;
}

export default function WhatsNewItem({ post }: WhatsNewItemProps) {
  return (
    <article className="whats-new__item">
      <div className="whats-new__thumb" aria-hidden="true">
        {post.emoji}
      </div>
      <div className="whats-new__text">
        <div className="whats-new__meta">
          <span className={`whats-new__badge whats-new__badge--${post.category}`}>
            {CATEGORY_LABELS[post.category]}
          </span>
          <time className="whats-new__date" dateTime={post.publishedAt}>
            {formatShortDate(post.publishedAt)}
          </time>
        </div>
        <div className="whats-new__title">{post.title}</div>
        <p className="whats-new__desc">{post.description}</p>
      </div>
    </article>
  );
}
