import type { Post } from "@/types/post";

/** A post as the API sends it: the backend names the save flag `is_saved_by_me`. */
export type ApiPost = Post & { is_saved_by_me?: boolean };

/** Normalize API response post to match frontend Post type */
export function normalizePost(p: ApiPost): Post {
  return {
    ...p,
    saved_by_me: p.saved_by_me ?? p.is_saved_by_me ?? false,
  };
}

/** Normalize an array of posts from API response */
export function normalizePosts(posts: ApiPost[]): Post[] {
  return (posts || []).map(normalizePost);
}
