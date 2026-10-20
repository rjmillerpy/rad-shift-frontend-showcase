"use client";
import { useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import type { Post } from "@/types/post";

type UseRepliesResult = {
  /** Which posts currently have their reply thread expanded. */
  openReplies: Record<number, boolean>;
  /** Replies already fetched, keyed by parent post id. */
  repliesByPost: Record<number, Post[]>;
  fetchReplies: (postId: number) => Promise<void>;
  /** Expand or collapse a thread, fetching its replies when it opens. */
  toggleReplies: (postId: number) => Promise<void>;
  /** The same, named as PostCard's props: spread into <PostCard {...replyProps} />. */
  replyProps: {
    openReplies: Record<number, boolean>;
    repliesByPost: Record<number, Post[]>;
    onFetchReplies: (postId: number) => Promise<void>;
    onToggleReplies: (postId: number) => Promise<void>;
  };
};

/** Reply-thread state for a feed: which threads are open and their replies. */
export function useReplies(): UseRepliesResult {
  const [openReplies, setOpenReplies] = useState<Record<number, boolean>>({});
  const [repliesByPost, setRepliesByPost] = useState<Record<number, Post[]>>({});

  const fetchReplies = useCallback(async (postId: number) => {
    try {
      const res = await api.get(`/posts/${postId}/replies`);
      const processedReplies: Post[] = (res.data.replies || []).map((reply: Post) => ({
        ...reply,
        is_me: reply.is_me ?? false,
        saved_by_me: reply.saved_by_me ?? false,
      }));
      setRepliesByPost((prev) => ({ ...prev, [postId]: processedReplies }));
    } catch (error) {
      // The thread simply stays empty; the feed itself is unaffected.
      console.error("Error fetching replies:", error);
    }
  }, []);

  const toggleReplies = useCallback(
    async (postId: number) => {
      const wasOpen = !!openReplies[postId];
      setOpenReplies((prev) => ({ ...prev, [postId]: !prev[postId] }));
      if (!wasOpen) await fetchReplies(postId);
    },
    [openReplies, fetchReplies],
  );

  const replyProps = useMemo(
    () => ({ openReplies, repliesByPost, onFetchReplies: fetchReplies, onToggleReplies: toggleReplies }),
    [openReplies, repliesByPost, fetchReplies, toggleReplies],
  );

  return { openReplies, repliesByPost, fetchReplies, toggleReplies, replyProps };
}
