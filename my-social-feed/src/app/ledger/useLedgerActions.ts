"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Post } from "@/types/post";

const REACTION_ACTIONS = new Set(["like", "repost", "save", "laugh"]);

/** Small helpers so each branch is a single-op await — keeps try/catch scopes
    narrow (rule 34) and replaces one big if/elif chain with a lookup map
    (rule 44). */
async function toggleReaction(action: string, postId: number): Promise<void> {
  await api.post(`/posts/${action}/${postId}`);
}

async function sharePost(post: Post): Promise<void> {
  const res = await api.post(`/posts/share/${post.id}`);
  const url = window.location.origin + (res.data.share_url || `/post/${post.id}`);
  await navigator.clipboard.writeText(url);
  alert("Post link copied!");
}

async function reportSlop(post: Post, prefix: string, defaultReason: string): Promise<void> {
  const reason = prompt(`${prefix}?`, defaultReason);
  if (!reason) return;
  await api.post(`/posts/slop/${post.id}`, {
    reason: prefix === "Report reason" ? `[REPORT] ${reason}` : reason,
  });
}

type Handlers = Record<string, (post: Post) => Promise<void> | void>;

/**
 * Wraps the shared quick-action handling for context-menu clicks. Every branch
 * is its own function so its try scope stays small and its intent is obvious.
 */
export function useLedgerActions(onDone: () => void) {
  const router = useRouter();

  const handle = useCallback(async (action: string, post: Post) => {
    const handlers: Handlers = {
      share:   (p) => sharePost(p),
      slop:    (p) => reportSlop(p, "Why is this slop", "AI"),
      report:  (p) => reportSlop(p, "Report reason", "Harassment"),
      quote:   (p) => { router.push(`/post/${p.id}?quote=1`); },
      replies: (p) => { router.push(`/post/${p.id}?reply=1`); },
    };

    try {
      if (REACTION_ACTIONS.has(action)) {
        await toggleReaction(action, post.id);
      } else if (handlers[action]) {
        await handlers[action](post);
      }
    } catch (e) {
      // Rule 14 — log with context so the failure is observable even though
      // we degrade gracefully by just closing the menu.
      console.error("Ledger quick action '%s' failed for post %d:", action, post.id, e);
    } finally {
      onDone();
    }
  }, [router, onDone]);

  return handle;
}
