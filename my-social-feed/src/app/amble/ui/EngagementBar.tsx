"use client";
import { useCallback, useEffect, useState } from "react";
import type { AmblePost } from "../data/schema";
import {
  toggleLike,
  toggleRepost,
  toggleSave,
} from "../services/engagement";

// ── Engagement action bar (Phase 1.5) ─────────────────────────────────────
// Rendered inside the post body so likes / reposts / saves live right
// under the content the player is reading. Buttons keep local state so
// the UI reacts immediately; the backend response updates the count for
// consistency (ENGAGE-02). If a request fails we log and leave the state
// as the last confirmed value — cheap enough for this frame.

type EngagementState = {
  likes: number;
  reposts: number;
  saves: number;
  liked_by_me: boolean;
  reposted_by_me: boolean;
  saved_by_me: boolean;
};

function initialEngagementState(post: AmblePost): EngagementState {
  return {
    likes: post.likes,
    reposts: post.reposts,
    saves: post.saves,
    liked_by_me: post.liked_by_me,
    reposted_by_me: post.reposted_by_me,
    saved_by_me: false,
  };
}

export default function EngagementBar({ post }: { post: AmblePost }) {
  const [state, setState] = useState<EngagementState>(() =>
    initialEngagementState(post),
  );
  const [pending, setPending] = useState<
    "like" | "repost" | "save" | null
  >(null);

  // Reset state when the post changes so the counters don't leak between
  // successive interactions.
  useEffect(() => {
    setState(initialEngagementState(post));
  }, [post]);

  const runLike = useCallback(async () => {
    if (pending) return;
    setPending("like");
    try {
      const result = await toggleLike(post.id);
      setState((s) => ({
        ...s,
        likes: result.likes,
        liked_by_me: result.liked_by_me,
      }));
    } catch (e) {
      console.error("amble like failed", e);
    } finally {
      setPending(null);
    }
  }, [pending, post.id]);

  const runRepost = useCallback(async () => {
    if (pending) return;
    setPending("repost");
    try {
      const result = await toggleRepost(post.id);
      setState((s) => ({
        ...s,
        reposts: result.reposts,
        reposted_by_me: result.reposted_by_me,
      }));
    } catch (e) {
      console.error("amble repost failed", e);
    } finally {
      setPending(null);
    }
  }, [pending, post.id]);

  const runSave = useCallback(async () => {
    if (pending) return;
    setPending("save");
    try {
      const result = await toggleSave(post.id);
      setState((s) => ({
        ...s,
        saves: result.saves,
        saved_by_me: result.saved_by_me,
      }));
    } catch (e) {
      console.error("amble save failed", e);
    } finally {
      setPending(null);
    }
  }, [pending, post.id]);

  return (
    <div
      data-testid="amble-engagement-bar"
      style={{
        display: "flex",
        gap: 16,
        marginTop: 10,
        alignItems: "center",
      }}
    >
      <EngagementButton
        testId="amble-engagement-like"
        label={state.liked_by_me ? "♥" : "♡"}
        count={state.likes}
        active={state.liked_by_me}
        pending={pending === "like"}
        onClick={runLike}
      />
      <EngagementButton
        testId="amble-engagement-repost"
        label={state.reposted_by_me ? "↻" : "↺"}
        count={state.reposts}
        active={state.reposted_by_me}
        pending={pending === "repost"}
        onClick={runRepost}
      />
      <EngagementButton
        testId="amble-engagement-save"
        label={state.saved_by_me ? "★" : "☆"}
        count={state.saves}
        active={state.saved_by_me}
        pending={pending === "save"}
        onClick={runSave}
      />
    </div>
  );
}

function EngagementButton({
  testId,
  label,
  count,
  active,
  pending,
  onClick,
}: {
  testId: string;
  label: string;
  count: number;
  active: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  const color = active ? "#f9c74f" : "rgba(244, 239, 228, 0.85)";
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={pending}
      style={{
        background: "transparent",
        border: `1px solid ${active ? "#f9c74f" : "rgba(255,255,255,0.25)"}`,
        borderRadius: 4,
        color,
        cursor: pending ? "wait" : "pointer",
        fontSize: 12,
        padding: "4px 10px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span style={{ marginRight: 6, fontSize: 14 }}>{label}</span>
      {count}
    </button>
  );
}
