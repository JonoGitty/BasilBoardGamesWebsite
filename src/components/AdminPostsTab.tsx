import { useState } from 'react';
import { useAdminPosts } from '../hooks/useAdminPosts';
import { track } from '../analytics/track';
import { formatShortDate } from '../utils/date';
import type { AdminPost, PostCategory } from '../types/whatsNew';
import type { PostPayload } from '../types/admin';

const CATEGORIES: PostCategory[] = ['patch', 'experiment', 'announcement'];

function PostForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AdminPost;
  onSave: (payload: PostPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [category, setCategory] = useState<PostCategory>(initial?.category ?? 'announcement');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      id: initial?.id ?? crypto.randomUUID(),
      title,
      description,
      emoji,
      category,
    });
    setBusy(false);
  };

  return (
    <form className="admin__form" onSubmit={handleSubmit}>
      <label className="settings__field">
        <span className="settings__label">Title</span>
        <input
          className="settings__input"
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="settings__field">
        <span className="settings__label">Description</span>
        <textarea
          className="settings__input admin__textarea"
          required
          maxLength={500}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="settings__field">
        <span className="settings__label">Emoji</span>
        <input
          className="settings__input admin__emoji-input"
          type="text"
          required
          maxLength={4}
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
      </label>
      <fieldset className="settings__field settings__fieldset">
        <legend className="settings__label">Category</legend>
        <div className="admin__category-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`whats-new__badge whats-new__badge--${cat} admin__category-btn${category === cat ? ' admin__category-btn--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="admin__form-actions">
        <button className="game-launch__btn" type="submit" disabled={busy}>
          {busy ? 'Saving...' : initial ? 'Update' : 'Create Draft'}
        </button>
        <button className="settings__reset" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function PostRow({
  post,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  post: AdminPost;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="admin__post-row">
      <span className="admin__post-emoji" aria-hidden="true">{post.emoji}</span>
      <div className="admin__post-info">
        <span className="admin__post-title">{post.title}</span>
        <span className="admin__post-meta">
          <span className={`whats-new__badge whats-new__badge--${post.category}`}>
            {post.category}
          </span>
          {post.published && post.publishedAt && (
            <span className="admin__post-date">
              Published {formatShortDate(post.publishedAt)}
            </span>
          )}
          {!post.published && (
            <span className="admin__draft-badge">Draft</span>
          )}
        </span>
      </div>
      <div className="admin__post-actions">
        <button className="admin__action-btn" onClick={onEdit}>Edit</button>
        {post.published ? (
          <button className="admin__action-btn admin__action-btn--warn" onClick={onUnpublish}>
            Unpublish
          </button>
        ) : (
          <button className="admin__action-btn admin__action-btn--accent" onClick={onPublish}>
            Publish
          </button>
        )}
        <button className="admin__action-btn admin__action-btn--danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminPostsTab() {
  const { posts, loading, error, create, update, publish, unpublish, remove } = useAdminPosts();
  const [editing, setEditing] = useState<AdminPost | 'new' | null>(null);

  const handleSave = async (payload: PostPayload) => {
    if (editing === 'new') {
      const result = await create(payload);
      if (result.ok) {
        track('admin_post_create', { postId: payload.id });
        setEditing(null);
      }
    } else if (editing) {
      const result = await update(editing.id, payload);
      if (result.ok) setEditing(null);
    }
  };

  const handlePublish = async (postId: string) => {
    const result = await publish(postId);
    if (result.ok) track('admin_post_publish', { postId });
  };

  const handleUnpublish = async (postId: string) => {
    const result = await unpublish(postId);
    if (result.ok) track('admin_post_unpublish', { postId });
  };

  const handleDelete = async (postId: string) => {
    const result = await remove(postId);
    if (result.ok) track('admin_post_delete', { postId });
  };

  if (loading) return <p className="admin__loading">Loading posts...</p>;

  if (editing) {
    return (
      <PostForm
        initial={editing === 'new' ? undefined : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      {error && <p className="admin__error">{error}</p>}
      <button
        className="game-launch__btn admin__create-btn"
        onClick={() => setEditing('new')}
      >
        + New Post
      </button>
      <div className="admin__list">
        {posts.map((post) => (
          <PostRow
            key={post.id}
            post={post}
            onEdit={() => setEditing(post)}
            onPublish={() => void handlePublish(post.id)}
            onUnpublish={() => void handleUnpublish(post.id)}
            onDelete={() => void handleDelete(post.id)}
          />
        ))}
        {posts.length === 0 && (
          <p className="admin__empty">No posts yet. Create your first one above.</p>
        )}
      </div>
    </div>
  );
}
