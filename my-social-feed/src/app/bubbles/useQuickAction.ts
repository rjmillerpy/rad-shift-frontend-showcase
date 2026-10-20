"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Post } from "@/types/post";

/**
 * Handler for the right-click quick action menu on post bubbles.
 *
 * Kept as a hook so the enclosing page doesn't have to know how each of the
 * nine actions dispatches — it just wires the returned function into the
 * QuickActionMenu component. Reactions mutate the post list in place via
 * `mutatePosts`; slop/report REMOVE the post from the list.
 */
export function useQuickAction(mutatePosts: (fn: (prev: Post[]) => Post[]) => void) {
  const router = useRouter();

  return useCallback(async (action: string, post: Post) => {
    try {
      if (action === "like" || action === "repost" || action === "save" || action === "laugh") {
        const res = await api.post(`/posts/${action}/${post.id}`);
        mutatePosts((prev) => prev.map((p) => p.id === post.id ? { ...p, ...applyReactionUpdate(action, res.data) } : p));
        return;
      }
      if (action === "share") {
        const res = await api.post(`/posts/share/${post.id}`);
        const url = window.location.origin + (res.data.share_url || `/post/${post.id}`);
        await navigator.clipboard.writeText(url);
        alert("Post link copied!");
        return;
      }
      if (action === "slop") {
        const reason = prompt("Why is this slop?", "AI");
        if (!reason) return;
        await api.post(`/posts/slop/${post.id}`, { reason });
        mutatePosts((prev) => prev.filter((p) => p.id !== post.id));
        return;
      }
      if (action === "report") {
        const reason = prompt(
          "Report reason:\n• Harassment or Bullying\n• Spam\n• Misinformation\n• Hate Speech\n• Other",
          "Harassment or Bullying",
        );
        if (!reason) return;
        await api.post(`/posts/slop/${post.id}`, { reason: `[REPORT] ${reason}` });
        mutatePosts((prev) => prev.filter((p) => p.id !== post.id));
        alert("Report submitted. This post will no longer appear in your feed.");
        return;
      }
      if (action === "quote") { router.push(`/post/${post.id}?quote=1`); return; }
      if (action === "replies") { router.push(`/post/${post.id}?reply=1`); return; }
    } catch (e) {
      console.error("Quick action failed:", e);
    }
  }, [mutatePosts, router]);
}

/** Given a reaction action + backend response, produce the partial Post update. */
function applyReactionUpdate(action: string, data: Record<string, unknown>): Partial<Post> {
  if (action === "like") return { likes: data.likes as number, liked_by_me: data.action === "liked" };
  if (action === "repost") return { reposts: data.reposts as number, reposted_by_me: data.action === "re-posted" };
  if (action === "save") return { saves: data.saves as number, saved_by_me: data.action === "saved" };
  if (action === "laugh") return { laughs: data.laughs as number, laughed_by_me: data.action === "laughed" };
  return {};
}
