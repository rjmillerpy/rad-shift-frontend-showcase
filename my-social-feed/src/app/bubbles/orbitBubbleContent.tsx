"use client";
import React from "react";
import { DEFAULT_AVATAR } from "@/lib/config";
import { isPlaceholderAvatar, proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";
import type { OrbitItem } from "./types";
import { GENERAL_TOPICS, HEX_AVATAR_CLIP } from "./constants";

// Character caps for text truncation inside a bubble body.
const AUDIO_CAPTION_MAX_CHARS = 40;

export type MediaType = "video" | "image" | "audio" | "text" | null;

export type BubbleVisual = {
  bgColor: string;
  border: string;
  fontSize: string;
  content: React.ReactNode;
  baseShadow: string;
  tagColor?: string;
};

/** How many characters can fit inside a post bubble of the given diameter. */
export function getMaxChars(size: number): number {
  return Math.max(20, Math.round((size - 30) * 0.9));
}

/** Classify a post's media so the bubble knows which shape/content to render. */
export function classifyMedia(post: Post): MediaType {
  if (post.video_url) return "video";
  // Reject ui-avatars placeholders — they'd otherwise render as gold-framed
  // "US" boxes instead of falling through to the text-circle path.
  if (post.image_url && !isPlaceholderAvatar(post.image_url)) return "image";
  if (post.audio_url) return "audio";
  return "text";
}

// ── Visual builder ───────────────────────────────────────────────────────────

export function buildBubbleVisual(
  item: OrbitItem,
  size: number,
  centerColor: string,
  carouselIndex: Record<number, number>,
): BubbleVisual {
  if (item.type === "back") return controlVisual("#555", "2px solid #888", "28px", "←", centerColor);
  if (item.type === "balloon") return controlVisual("#e74c3c", "2px solid #fff", "32px", "🎈", centerColor);
  if (item.type === "paginate") {
    return controlVisual(
      "#333", "2px solid #666", "13px",
      <img src="/paginate.png" alt="Load more" width={50} height={50}
        style={{ borderRadius: "50%", objectFit: "cover" }} />,
      centerColor,
    );
  }
  if (item.type === "subcategory" || item.type === "micro") {
    const tagColor = GENERAL_TOPICS.find((t) => t.label.toLowerCase() === item.tag.toLowerCase())?.color
      || (item.type === "micro" ? "#555" : "#8e44ad");
    return {
      bgColor: tagColor,
      border: item.type === "micro" ? "1px dashed rgba(255,255,255,0.5)" : `3px solid ${tagColor}`,
      fontSize: item.type === "micro" ? "11px" : "13px",
      content: item.label,
      baseShadow: `0 0 18px ${tagColor}aa, 0 0 4px ${tagColor}`,
      tagColor,
    };
  }
  return buildPostVisual(item, size, centerColor, carouselIndex);
}

function controlVisual(bg: string, border: string, fontSize: string, content: React.ReactNode, centerColor: string): BubbleVisual {
  return { bgColor: bg, border, fontSize, content, baseShadow: `0 0 12px ${centerColor}88` };
}

function buildPostVisual(
  item: Extract<OrbitItem, { type: "post" }>,
  size: number,
  centerColor: string,
  carouselIndex: Record<number, number>,
): BubbleVisual {
  const p = item.post;
  const media = classifyMedia(p);
  const truncText = item.label.length > getMaxChars(size)
    ? item.label.slice(0, getMaxChars(size)) + "…"
    : item.label;
  const bgColor = centerColor + "cc";

  if (media === "video") {
    return {
      bgColor,
      border: "3px solid #444",
      fontSize: "13px",
      content: <VideoBubbleContent post={p} />,
      baseShadow: "0 0 15px rgba(68,68,68,0.6), inset 0 0 10px rgba(0,0,0,0.5)",
    };
  }
  if (media === "image") {
    return {
      bgColor,
      border: "4px solid #d4a017",
      fontSize: "13px",
      content: <ImageBubbleContent post={p} carouselIndex={carouselIndex} />,
      baseShadow: "0 2px 8px rgba(0,0,0,0.4), 0 0 1px #d4a017",
    };
  }
  if (media === "audio") {
    return {
      bgColor,
      border: "3px solid #777",
      fontSize: "13px",
      content: <AudioBubbleContent size={size} truncText={truncText} />,
      baseShadow: "0 0 10px rgba(119,119,119,0.4)",
    };
  }
  return {
    bgColor,
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: size >= 140 ? "12px" : size >= 110 ? "11px" : "10px",
    content: <TextBubbleContent post={p} size={size} truncText={truncText} />,
    baseShadow: `inset 0 0 20px rgba(255,255,255,0.08), 0 0 8px ${bgColor}44`,
  };
}

// ── Media content components ─────────────────────────────────────────────────

function VideoBubbleContent({ post }: { post: Post }) {
  return (
    <div data-testid="video-bubble" style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: "inherit" }}>
      {post.image_url ? (
        <img src={proxyIfNeeded(post.image_url)} alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : post.video_url ? (
        <video src={post.video_url} muted playsInline preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.5; }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a1a2e, #16213e)", zIndex: -1 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #b87333", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
        <div style={{ width: 0, height: 0, borderLeft: "12px solid #fff", borderTop: "7px solid transparent", borderBottom: "7px solid transparent", marginLeft: "3px" }} />
      </div>
    </div>
  );
}

function ImageBubbleContent({ post, carouselIndex }: { post: Post; carouselIndex: Record<number, number> }) {
  const imgs = post.image_urls && post.image_urls.length > 1 ? post.image_urls : [post.image_url!];
  const idx = (carouselIndex[post.id] || 0) % imgs.length;
  return (
    <div data-testid="image-bubble" style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: "inherit", position: "relative" }}>
      <img src={proxyIfNeeded(imgs[idx])} alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.5s" }}
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
      {imgs.length > 1 && (
        <div data-testid="carousel-dots" style={{ position: "absolute", bottom: "4px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "3px", zIndex: 2 }}>
          {imgs.map((_, di) => (
            <div key={di} style={{ width: "6px", height: "6px", borderRadius: "50%", background: di === idx ? "#fff" : "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.3)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

function AudioBubbleContent({ size, truncText }: { size: number; truncText: string }) {
  const canFitCaption = truncText.length <= AUDIO_CAPTION_MAX_CHARS;
  const grillW = Math.round(size * 0.38);
  const grillBarH = Math.max(3, Math.round(size * 0.035));
  const grillGap = Math.max(2, Math.round(size * 0.025));
  const grillBars = Math.max(5, Math.round(size * 0.06));
  const dialSz = Math.round(size * 0.38);
  const needleH = Math.round(dialSz * 0.35);
  const dotSz = Math.round(dialSz * 0.14);
  return (
    <div data-testid="audio-bubble" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", height: "100%", padding: "8px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.08) + "px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: grillGap + "px" }}>
          {[...Array(grillBars)].map((_, k) => (
            <div key={k} style={{ width: grillW + "px", height: grillBarH + "px", background: "#888", borderRadius: "1px" }} />
          ))}
        </div>
        <div style={{ width: dialSz + "px", height: dialSz + "px", borderRadius: "50%", border: "3px solid #aaa", background: "#2a2a2a", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: "4px", left: "50%", width: "2px", height: needleH + "px", background: "#e74c3c", transformOrigin: "bottom", transform: "translateX(-50%) rotate(40deg)" }} />
          <div style={{ position: "absolute", bottom: "4px", left: "50%", transform: "translateX(-50%)", width: dotSz + "px", height: dotSz + "px", borderRadius: "50%", background: "#666" }} />
        </div>
      </div>
      {canFitCaption && <span style={{ fontSize: "10px", lineHeight: 1.1, textAlign: "center", color: "#ccc", maxWidth: "100%" }}>{truncText}</span>}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #b87333", background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, pointerEvents: "none" }}>
        <div style={{ width: 0, height: 0, borderLeft: "10px solid #fff", borderTop: "6px solid transparent", borderBottom: "6px solid transparent", marginLeft: "2px" }} />
      </div>
    </div>
  );
}

function TextBubbleContent({ post, size, truncText }: { post: Post; size: number; truncText: string }) {
  const avatarSize = Math.max(16, Math.round(size * 0.18));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", overflow: "hidden" }}>
      <img src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)} alt=""
        style={{ width: avatarSize, height: avatarSize, objectFit: "cover", flexShrink: 0, clipPath: HEX_AVATAR_CLIP }} />
      <span style={{ lineHeight: 1.1 }}>{truncText}</span>
    </div>
  );
}
