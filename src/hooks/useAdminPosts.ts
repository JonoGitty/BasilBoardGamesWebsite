import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllPosts,
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  deletePost,
} from '../services/adminApi';
import type { AdminPost } from '../types/whatsNew';
import type { PostPayload } from '../types/admin';

export function useAdminPosts() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchAllPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllPosts().then((data) => {
      if (!cancelled) {
        setPosts(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const create = useCallback(
    async (payload: PostPayload) => {
      setError(null);
      const result = await createPost(payload);
      if (!result.ok) {
        setError(result.error ?? 'Create failed');
      } else {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const update = useCallback(
    async (postId: string, payload: Partial<PostPayload>) => {
      setError(null);
      const result = await updatePost(postId, payload);
      if (!result.ok) {
        setError(result.error ?? 'Update failed');
      } else {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const publish = useCallback(
    async (postId: string) => {
      // Optimistic
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, published: true, publishedAt: new Date().toISOString() }
            : p,
        ),
      );
      setError(null);

      const result = await publishPost(postId);
      if (!result.ok) {
        setError(result.error ?? 'Publish failed');
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const unpublish = useCallback(
    async (postId: string) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, published: false } : p)),
      );
      setError(null);

      const result = await unpublishPost(postId);
      if (!result.ok) {
        setError(result.error ?? 'Unpublish failed');
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (postId: string) => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setError(null);

      const result = await deletePost(postId);
      if (!result.ok) {
        setError(result.error ?? 'Delete failed');
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  return { posts, loading, error, create, update, publish, unpublish, remove, refresh };
}
