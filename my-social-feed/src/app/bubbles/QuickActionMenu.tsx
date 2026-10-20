"use client";
import React, { useRef } from "react";
import { useDismiss } from "@/hooks/useDismiss";
import { useRouter } from "next/navigation";
import type { Post } from "@/types/post";

// Actions triggered by clicking a row in the right-click menu.
type QuickAction =
  | "like" | "repost" | "save" | "laugh"
  | "share" | "quote" | "replies" | "slop" | "report";

type Props = {
  post: Post;
  x: number;
  y: number;
  onAction: (action: QuickAction, post: Post) => void;
  onClose: () => void;
};

function buildMenuItems(post: Post): Array<{ label: string; action: QuickAction; active: boolean }> {
  return [
    { label: post.liked_by_me ? "❤️ Unlike" : "❤️ Like", action: "like", active: !!post.liked_by_me },
    { label: post.reposted_by_me ? "🔁 Unrepost" : "🔁 Repost", action: "repost", active: !!post.reposted_by_me },
    { label: post.saved_by_me ? "💾 Unsave" : "💾 Save", action: "save", active: !!post.saved_by_me },
    { label: post.laughed_by_me ? "😂 Unlaugh" : "😂 Laugh", action: "laugh", active: !!post.laughed_by_me },
    { label: "🔗 Share", action: "share", active: false },
    { label: "💬 Quote", action: "quote", active: false },
    { label: "💭 Replies", action: "replies", active: false },
    { label: "🚩 Mark as Slop", action: "slop", active: false },
    { label: "⚠️ Report", action: "report", active: false },
  ];
}

function actionColor(action: QuickAction): string {
  if (action === "report") return "#e74c3c";
  if (action === "slop") return "#e67e22";
  return "#fff";
}

/** Right-click context menu shown when a user right-clicks a post bubble.
    All post interactions live behind this single menu so the bubbles
    themselves stay clickable-to-drill without competing UI.

    Dismisses on a press outside or Escape (useDismiss) rather than on
    mouseleave, which fired when the cursor briefly left the menu between
    two buttons and made every reaction take several tries. */
export default function QuickActionMenu({ post, x, y, onAction, onClose }: Props) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  useDismiss(menuRef, onClose);
  const items = buildMenuItems(post);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Post actions"
      data-testid="quick-action-menu"
      style={{
        position: "fixed",
        left: x,
        top: y,
        background: "rgba(30,30,30,0.95)",
        border: "1px solid #555",
        borderRadius: "8px",
        padding: "4px 0",
        zIndex: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        minWidth: "120px",
      }}
    >
      {items.map((a) => (
        <button
          role="menuitem"
          key={a.action}
          data-testid={`quick-${a.action}`}
          onClick={() => onAction(a.action, post)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "8px 16px",
            background: "none",
            border: "none",
            color: actionColor(a.action),
            fontSize: "13px",
            cursor: "pointer",
            textAlign: "left",
            borderTop: a.action === "slop" ? "1px solid #444" : "none",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <span>{a.label}</span>
          {a.active && (
            <span data-testid={`${a.action}-active`} style={{ fontSize: "11px", color: "#4caf50" }}>✓</span>
          )}
        </button>
      ))}
      <button
        role="menuitem"
        onClick={() => { router.push(`/post/${post.id}`); onClose(); }}
        style={{
          display: "block",
          width: "100%",
          padding: "8px 16px",
          background: "none",
          border: "none",
          borderTop: "1px solid #444",
          color: "#aaa",
          fontSize: "13px",
          cursor: "pointer",
          textAlign: "left",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
      >
        Open post
      </button>
    </div>
  );
}
