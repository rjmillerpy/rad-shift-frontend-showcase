"use client";
import { useCallback } from "react";
import api from "@/lib/api";
import type { Post } from "@/types/post";

type PostUpdater = (fn: (prev: Post[]) => Post[]) => void;

/**
 * Hook providing reusable post action handlers (like, laugh, repost, save, share, slop, report).
 * Each handler calls the API and updates the local posts state via the provided setter.
 */
export function usePostActions(setPosts: PostUpdater) {
  const updatePost = useCallback(
    (postId: number, updates: Partial<Post>) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
      );
    },
    [setPosts]
  );

  const toggleLike = useCallback(
    async (postId: number) => {
      try {
        const res = await api.post(`/posts/like/${postId}`);
        updatePost(postId, {
          likes: res.data.likes,
          liked_by_me: res.data.action === "liked",
        });
      } catch (e) {
        console.error("Like failed", e);
      }
    },
    [updatePost]
  );

  const toggleLaugh = useCallback(
    async (postId: number) => {
      try {
        const res = await api.post(`/posts/laugh/${postId}`);
        updatePost(postId, {
          laughs: res.data.laughs,
          laughed_by_me: res.data.action === "laughed",
        });
      } catch (e) {
        console.error("Laugh failed", e);
      }
    },
    [updatePost]
  );

  const toggleRepost = useCallback(
    async (postId: number) => {
      try {
        const res = await api.post(`/posts/repost/${postId}`);
        updatePost(postId, {
          reposts: res.data.reposts,
          reposted_by_me: res.data.action === "re-posted",
        });
      } catch (e) {
        console.error("Repost failed", e);
      }
    },
    [updatePost]
  );

  const toggleSave = useCallback(
    async (postId: number): Promise<boolean> => {
      try {
        const res = await api.post(`/posts/save/${postId}`);
        updatePost(postId, {
          saves: res.data.saves,
          saved_by_me: res.data.action === "saved",
        });
        return res.data.action === "saved";
      } catch (e) {
        console.error("Save failed", e);
        return false;
      }
    },
    [updatePost]
  );

  const sharePost = useCallback(
    async (postId: number): Promise<string | null> => {
      try {
        const res = await api.post(`/posts/share/${postId}`);
        updatePost(postId, { shares: res.data.shares });
        return res.data.share_url || null;
      } catch (e) {
        console.error("Share failed", e);
        return null;
      }
    },
    [updatePost]
  );

  const reportSlop = useCallback(
    async (postId: number, reason: string) => {
      try {
        await api.post(`/posts/slop/${postId}`, { reason });
        updatePost(postId, {
          slop_count: undefined, // let server handle count
        });
      } catch (e) {
        console.error("Slop report failed", e);
      }
    },
    [updatePost]
  );

  const reportPost = useCallback(
    async (postId: number) => {
      try {
        await api.post(`/posts/report/${postId}`);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch (e) {
        console.error("Report failed", e);
      }
    },
    [setPosts]
  );

  return {
    toggleLike,
    toggleLaugh,
    toggleRepost,
    toggleSave,
    sharePost,
    reportSlop,
    reportPost,
  };
}
