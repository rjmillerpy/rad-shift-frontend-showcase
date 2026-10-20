"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";

const HEX_AVATAR_CLIP = "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)";
const TOOLTIP_WIDTH = 260;

type PostTooltipProps = {
  post: Post;
  x: number;
  y: number;
  onReact: (postId: number, action: string) => void;
  onClose: () => void;
};

/** Small hover panel that shows author + reaction buttons for a post inline
    in the chapter narrative. Positioned in fixed viewport coords. */
export function PostTooltip({ post, x, y, onReact, onClose }: PostTooltipProps) {
  return (
    <div
      data-testid="post-tooltip"
      style={{
        position: "fixed",
        left: Math.min(x, window.innerWidth - TOOLTIP_WIDTH),
        top: y - 80,
        background: "rgba(44, 24, 16, 0.95)",
        border: "1px solid #8b7355",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#f5f0e8",
        fontSize: "12px",
        zIndex: 100,
        pointerEvents: "auto",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        fontFamily: "'Georgia', serif",
        maxWidth: "240px",
      }}
      onMouseLeave={onClose}
    >
      <div style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
        <img src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)} alt=""
          style={{ width: 20, height: 20, objectFit: "cover", clipPath: HEX_AVATAR_CLIP }} />
        <Link href={`/profile/${post.username}`} style={{ color: "#d4c5a9", textDecoration: "none", fontWeight: "bold" }}>
          @{post.username}
        </Link>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <button onClick={() => onReact(post.id, "like")} data-testid="tooltip-like"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px",
            filter: post.liked_by_me ? "saturate(200%)" : "saturate(50%)", padding: "2px" }}>
          ❤️ <span style={{ fontSize: "11px", color: "#d4c5a9" }}>{post.likes}</span>
        </button>
        <button onClick={() => onReact(post.id, "laugh")} data-testid="tooltip-laugh"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px",
            filter: post.laughed_by_me ? "saturate(200%)" : "saturate(50%)", padding: "2px" }}>
          😂 <span style={{ fontSize: "11px", color: "#d4c5a9" }}>{post.laughs ?? 0}</span>
        </button>
        <button onClick={() => onReact(post.id, "save")} data-testid="tooltip-save"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px",
            filter: post.saved_by_me ? "saturate(200%)" : "saturate(50%)", padding: "2px" }}>
          💾 <span style={{ fontSize: "11px", color: "#d4c5a9" }}>{post.saves}</span>
        </button>
        <Link href={`/post/${post.id}`} style={{ marginLeft: "auto", color: "#8b7355", fontSize: "11px", textDecoration: "none" }}>
          view →
        </Link>
      </div>
    </div>
  );
}

type ContextMenuProps = {
  post: Post;
  x: number;
  y: number;
  onReact: (postId: number, action: string) => void;
  onClose: () => void;
};

/** Right-click menu offering reactions + share + view for an inline post. */
export function ContextMenu({ post, x, y, onReact, onClose }: ContextMenuProps) {
  const router = useRouter();

  const items = [
    { label: post.liked_by_me ? "❤️ Unlike" : "❤️ Like", action: "like", active: !!post.liked_by_me },
    { label: post.laughed_by_me ? "😂 Unlaugh" : "😂 Laugh", action: "laugh", active: !!post.laughed_by_me },
    { label: post.saved_by_me ? "💾 Unsave" : "💾 Save", action: "save", active: !!post.saved_by_me },
    { label: "🔗 Share", action: "share", active: false },
    { label: "💬 View Post", action: "view", active: false },
  ];

  const handleAction = async (action: string) => {
    if (action === "view") {
      router.push(`/post/${post.id}`);
    } else if (action === "share") {
      try {
        const res = await api.post(`/posts/share/${post.id}`);
        const url = window.location.origin + (res.data.share_url || `/post/${post.id}`);
        await navigator.clipboard.writeText(url);
        alert("Post link copied!");
      } catch (e) {
        console.error("Chronicle share failed:", e);
      }
    } else {
      onReact(post.id, action);
    }
    onClose();
  };

  return (
    <div
      data-testid="context-menu"
      style={{
        position: "fixed",
        left: x,
        top: y,
        background: "rgba(44, 24, 16, 0.95)",
        border: "1px solid #8b7355",
        borderRadius: "8px",
        padding: "4px 0",
        zIndex: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        minWidth: "140px",
        fontFamily: "'Georgia', serif",
      }}
      onMouseLeave={onClose}
    >
      {items.map((a) => (
        <button
          key={a.action}
          data-testid={`ctx-${a.action}`}
          onClick={() => handleAction(a.action)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "8px 16px",
            background: "none",
            border: "none",
            color: "#f5f0e8",
            fontSize: "13px",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "'Georgia', serif",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <span>{a.label}</span>
          {a.active && <span style={{ fontSize: "11px", color: "#4caf50" }}>✓</span>}
        </button>
      ))}
    </div>
  );
}
