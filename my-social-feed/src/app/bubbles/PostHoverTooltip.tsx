"use client";
import React from "react";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";
import type { ViewportSize } from "./types";
import { HEX_AVATAR_CLIP } from "./constants";

// Distance from the cursor to place the tooltip, in pixels.
const TOOLTIP_OFFSET_PX = 15;
const TOOLTIP_MAX_WIDTH_PX = 320;
const TOOLTIP_MAX_HEIGHT_PX = 120;

type Props = {
  post: Post;
  x: number;
  y: number;
  viewport: ViewportSize;
};

/** Small pointer-events:none card that follows the cursor while hovering
    a post bubble. Shows author, text, and engagement counts. */
export default function PostHoverTooltip({ post, x, y, viewport }: Props) {
  return (
    <div
      data-testid="post-tooltip"
      style={{
        position: "fixed",
        left: Math.min(x + TOOLTIP_OFFSET_PX, viewport.w - TOOLTIP_MAX_WIDTH_PX),
        top: Math.min(y + TOOLTIP_OFFSET_PX, viewport.h - TOOLTIP_MAX_HEIGHT_PX),
        maxWidth: "300px",
        background: "rgba(20,20,20,0.95)",
        border: "1px solid #444",
        borderRadius: "10px",
        padding: "12px",
        color: "#fff",
        fontSize: "13px",
        zIndex: 100,
        pointerEvents: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        lineHeight: 1.4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <img
          src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)}
          alt=""
          style={{
            width: 28, height: 28, objectFit: "cover", flexShrink: 0,
            clipPath: HEX_AVATAR_CLIP,
          }}
        />
        <span style={{ fontWeight: "bold", color: "#aaa" }}>@{post.username}</span>
      </div>
      <div style={{ whiteSpace: "pre-wrap", marginBottom: "8px" }}>{post.text}</div>
      <div style={{ fontSize: "11px", color: "#888", display: "flex", flexWrap: "wrap", gap: "6px" }}>
        <span>❤️ {post.likes} likes</span>
        <span>😂 {post.laughs ?? 0} laughs</span>
        <span>🔁 {post.reposts} reposts</span>
        <span>🔗 {post.shares} shares</span>
        <span>💾 {post.saves} saves</span>
        <span>📝 {post.quotes_count ?? 0} quotes</span>
        {post.replies_count ? <span>💬 {post.replies_count} replies</span> : null}
        {post.slop_count ? <span>🚩 {post.slop_count} slop</span> : null}
      </div>
      <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
        {new Date(post.unix_timestamp * 1000).toLocaleString()}
      </div>
    </div>
  );
}
