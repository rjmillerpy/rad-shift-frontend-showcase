"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { usePostActions } from "@/hooks/usePostActions";
import type { Post } from "@/types/post";

type PostUpdater = (fn: (prev: Post[]) => Post[]) => void;

type Options = {
  /** After a post is marked as slop or reported. Default: drop it from the list. */
  onRemoved?: (postId: number) => void;
  /** Default: open the post page with the quote composer. */
  onQuote?: (postId: number) => void;
};

const REPORT_PREFIX = "[REPORT] ";

/** Every action a PostCard offers, wired to the API and to the page's posts.

    One implementation for every feed (profiles, search, media, the main
    feed, the post page). The copies it replaced had drifted: the media page
    followed and unfollowed through URLs the API doesn't have (404), and only
    some pages removed a slopped post or said when an action failed.

    Spread the result into a card: <PostCard {...actions} />. */
export function usePostInteractions(setPosts: PostUpdater, options: Options = {}) {
  const router = useRouter();
  const { token } = useAuth();
  const { toggleLike, toggleLaugh, toggleRepost, toggleSave, sharePost } = usePostActions(setPosts);
  const { onRemoved, onQuote } = options;

  const removePost = useCallback(
    (postId: number) => {
      if (onRemoved) onRemoved(postId);
      else setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    [onRemoved, setPosts],
  );

  const onShare = useCallback(
    async (postId: number) => {
      const shareUrl = await sharePost(postId);
      try {
        await navigator.clipboard.writeText(window.location.origin + (shareUrl || `/post/${postId}`));
        alert("Post link copied!");
      } catch (e) {
        console.error("Copying the post link failed:", e);
      }
    },
    [sharePost],
  );

  const flag = useCallback(
    async (postId: number, reason: string, confirmation: string | null, failure: string) => {
      if (!token) return;
      try {
        await api.post(`/posts/slop/${postId}`, { reason });
        removePost(postId);
        if (confirmation) alert(confirmation);
      } catch (e) {
        console.error(failure, e);
        alert(failure);
      }
    },
    [token, removePost],
  );

  const onMarkSlop = useCallback(
    (postId: number, reason: string) => flag(postId, reason, null, "Failed to mark as slop."),
    [flag],
  );

  const onReport = useCallback(
    (postId: number, reason: string) =>
      flag(
        postId,
        REPORT_PREFIX + reason,
        "Report submitted. This post will no longer appear in your feed.",
        "Failed to submit report.",
      ),
    [flag],
  );

  const onFollowToggle = useCallback(
    async (username: string, isFollowed: boolean) => {
      try {
        // The API: POST /follow/{username} and POST /follow/un/{username}.
        await api.post(`/follow${isFollowed ? "/un" : ""}/${username}`, {});
        setPosts((prev) => prev.map((p) => (p.username === username ? { ...p, is_followed_by_me: !isFollowed } : p)));
      } catch (e) {
        console.error("Toggling follow failed:", e);
      }
    },
    [setPosts],
  );

  const quote = useCallback(
    (postId: number) => (onQuote ? onQuote(postId) : router.push(`/post/${postId}?quote=1`)),
    [onQuote, router],
  );

  return useMemo(
    () => ({
      token,
      onToggleLike: toggleLike,
      onRepost: toggleRepost,
      onToggleSave: toggleSave,
      onToggleLaugh: toggleLaugh,
      onShare,
      onMarkSlop,
      onReport,
      onFollowToggle,
      onQuote: quote,
    }),
    [token, toggleLike, toggleRepost, toggleSave, toggleLaugh, onShare, onMarkSlop, onReport, onFollowToggle, quote],
  );
}
