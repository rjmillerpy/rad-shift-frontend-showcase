/**
 * Engagement client for the amble dialogue frame (Phase 1.5, ENGAGE-01/02,
 * INT-02).
 *
 * All handlers delegate to the app's existing `/posts/{action}/{post_id}`
 * endpoints (see `hooks/usePostActions.ts` — same shape, so like counts
 * and liked-by-me flags stay consistent across the app).
 */
import api from "@/lib/api";
import { AMBLE_ENGAGEMENT_EVENT } from "../data/constants";

export type EngagementKind = "like" | "repost" | "save";

export type LikeResult = {
  likes: number;
  liked_by_me: boolean;
};

export type RepostResult = {
  reposts: number;
  reposted_by_me: boolean;
};

export type SaveResult = {
  saves: number;
  saved_by_me: boolean;
};

function emitEngaged(kind: EngagementKind, postId: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AMBLE_ENGAGEMENT_EVENT, { detail: { kind, postId } }),
  );
}

export async function toggleLike(postId: number): Promise<LikeResult> {
  const res = await api.post(`/posts/like/${postId}`);
  const result: LikeResult = {
    likes: Number(res.data.likes ?? 0),
    liked_by_me: res.data.action === "liked",
  };
  emitEngaged("like", postId);
  return result;
}

export async function toggleRepost(postId: number): Promise<RepostResult> {
  const res = await api.post(`/posts/repost/${postId}`);
  const result: RepostResult = {
    reposts: Number(res.data.reposts ?? 0),
    reposted_by_me: res.data.action === "re-posted",
  };
  emitEngaged("repost", postId);
  return result;
}

export async function toggleSave(postId: number): Promise<SaveResult> {
  const res = await api.post(`/posts/save/${postId}`);
  const result: SaveResult = {
    saves: Number(res.data.saves ?? 0),
    saved_by_me: res.data.action === "saved",
  };
  emitEngaged("save", postId);
  return result;
}
