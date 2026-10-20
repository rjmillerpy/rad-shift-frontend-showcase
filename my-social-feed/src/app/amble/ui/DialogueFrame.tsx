"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DIALOGUE_CLOSE_EVENT,
  DIALOGUE_OPEN_EVENT,
  INTERACT_EVENT,
} from "../data/constants";
import {
  resolveInteraction,
  type InteractionResult,
} from "../systems/handlers";
import type { AmblePost, EntityAnchor } from "../data/schema";
import EngagementBar from "./EngagementBar";

const FRAME_BG = "rgba(20, 20, 22, 0.94)";
const FRAME_BORDER = "rgba(255, 255, 255, 0.35)";
const SPEAKER_COLOR = "#f9c74f";
const BODY_COLOR = "#f4efe4";
const HINT_COLOR = "rgba(244, 239, 228, 0.55)";
const META_COLOR = "rgba(244, 239, 228, 0.7)";
const ADVANCE_ACCENT = "#7bc678";

const frameStyle: React.CSSProperties = {
  position: "absolute",
  left: 24,
  right: 24,
  bottom: 24,
  minHeight: 90,
  padding: "16px 20px",
  background: FRAME_BG,
  border: `2px solid ${FRAME_BORDER}`,
  borderRadius: 8,
  color: BODY_COLOR,
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  zIndex: 20,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
};

type ViewState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "result"; result: InteractionResult; cursor: string | null };

/**
 * JRPG-style dialogue frame (MOVE-04). Shown at the bottom of the canvas.
 * Async path (CONTENT-01..06):
 *   - INTERACT_EVENT arrives with the target entity
 *   - fires DIALOGUE_OPEN_EVENT so the scene freezes the avatar
 *   - fetches content via `resolveInteraction` (sync handler → line,
 *     otherwise INT-01 → posts or empty state)
 *   - renders loading → post / line / empty-state
 *   - Enter/Escape closes; if the response has `next_cursor`, Space
 *     advances to the next post (CONTENT-04 freshness on re-interaction).
 *
 * Cursors are tracked per-entity for the lifetime of the tab. Persistence
 * across sessions lands in Phase 1.4d (server-side cursor table).
 */
export default function DialogueFrame() {
  const [view, setView] = useState<ViewState | null>(null);
  const currentEntity = useRef<EntityAnchor | null>(null);
  const cursorByEntity = useRef<Map<string, string | null>>(new Map());

  const close = useCallback(() => {
    setView(null);
    currentEntity.current = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(DIALOGUE_CLOSE_EVENT));
    }
  }, []);

  const load = useCallback(async (entity: EntityAnchor, cursor: string | null) => {
    setView({ kind: "loading" });
    try {
      const result = await resolveInteraction(entity, cursor);
      // If a new interact fired while we were loading, the ref will differ —
      // drop this response on the floor to avoid stomping the newer one.
      if (currentEntity.current?.id !== entity.id) return;
      const nextCursor =
        result.kind === "posts" ? result.nextCursor : cursor;
      cursorByEntity.current.set(entity.id, nextCursor);
      setView({ kind: "result", result, cursor });
    } catch {
      if (currentEntity.current?.id !== entity.id) return;
      setView({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onInteract = (event: Event) => {
      const detail = (event as CustomEvent<{ entity?: EntityAnchor }>).detail;
      if (!detail?.entity) return;
      currentEntity.current = detail.entity;
      const cursor = cursorByEntity.current.get(detail.entity.id) ?? null;
      window.dispatchEvent(new CustomEvent(DIALOGUE_OPEN_EVENT));
      void load(detail.entity, cursor);
    };
    window.addEventListener(INTERACT_EVENT, onInteract);
    return () => window.removeEventListener(INTERACT_EVENT, onInteract);
  }, [load]);

  useEffect(() => {
    if (!view || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      // Space advances to the next post if the current result has one.
      if (e.key === " " && view.kind === "result" && view.result.kind === "posts") {
        const entity = currentEntity.current;
        if (!entity) return;
        const nextCursor = view.result.nextCursor;
        if (nextCursor === null) return;
        e.preventDefault();
        void load(entity, nextCursor);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, close, load]);

  if (!view) return null;

  return (
    <div data-testid="amble-dialogue-frame" style={frameStyle}>
      {renderBody(view)}
      <div data-testid="amble-dialogue-hint" style={hintStyle}>
        {renderHint(view)}
      </div>
    </div>
  );
}

const hintStyle: React.CSSProperties = {
  color: HINT_COLOR,
  fontSize: 11,
  marginTop: 12,
  textAlign: "right",
};

function renderBody(view: ViewState) {
  if (view.kind === "loading") {
    return (
      <div data-testid="amble-dialogue-loading" style={{ opacity: 0.7 }}>
        Loading…
      </div>
    );
  }
  if (view.kind === "error") {
    return (
      <div data-testid="amble-dialogue-error">
        <div style={{ color: SPEAKER_COLOR, fontWeight: 600, marginBottom: 6 }}>
          Hmm
        </div>
        Something went wrong. Try again in a moment.
      </div>
    );
  }
  const { result } = view;
  if (result.kind === "line") {
    return (
      <>
        <div
          data-testid="amble-dialogue-speaker"
          style={{ color: SPEAKER_COLOR, fontWeight: 600, marginBottom: 6 }}
        >
          {result.line.speaker}
        </div>
        <div data-testid="amble-dialogue-text">{result.line.text}</div>
      </>
    );
  }
  if (result.kind === "empty") {
    return (
      <>
        <div
          data-testid="amble-dialogue-speaker"
          style={{ color: SPEAKER_COLOR, fontWeight: 600, marginBottom: 6 }}
        >
          {result.fallback.speaker}
        </div>
        <div data-testid="amble-dialogue-empty">{result.fallback.text}</div>
      </>
    );
  }
  // result.kind === "posts"
  const post = result.posts[0];
  if (!post) {
    return <div>Nothing to see.</div>;
  }
  return <PostBody post={post} />;
}

function PostBody({ post }: { post: AmblePost }) {
  return (
    <>
      <div
        data-testid="amble-dialogue-speaker"
        style={{ color: SPEAKER_COLOR, fontWeight: 600, marginBottom: 4 }}
      >
        @{post.author}
      </div>
      <div data-testid="amble-dialogue-post-text">{post.text}</div>
      <div
        data-testid="amble-dialogue-post-timestamp"
        style={{ color: META_COLOR, fontSize: 11, marginTop: 8 }}
      >
        {formatTimestamp(post.unix_timestamp)}
      </div>
      <EngagementBar post={post} />
    </>
  );
}

function formatTimestamp(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderHint(view: ViewState): React.ReactNode {
  if (view.kind !== "result" || view.result.kind !== "posts") {
    return "Enter / Esc to close";
  }
  const canAdvance = view.result.nextCursor !== null;
  return (
    <>
      {canAdvance && (
        <span style={{ color: ADVANCE_ACCENT, marginRight: 12 }}>
          Space for next
        </span>
      )}
      Enter / Esc to close
    </>
  );
}
