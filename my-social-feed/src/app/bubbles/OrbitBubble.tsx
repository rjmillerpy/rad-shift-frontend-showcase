"use client";
import React from "react";
import type { Post } from "@/types/post";
import type { OrbitItem } from "./types";
import {
  BubbleVisual,
  buildBubbleVisual,
  classifyMedia,
  MediaType,
} from "./orbitBubbleContent";

// Media-specific size overrides (raw px; scale in caller).
const VIDEO_MIN_W_PX = 160;
const VIDEO_MIN_H_PX = 100;
const IMAGE_MIN_PX = 110;
const TV_ANTENNA_FRAC = 0.35;
const RADIO_ANTENNA_FRAC = 0.3;
const TV_ANTENNA_MIN_PX = 30;
const RADIO_ANTENNA_MIN_PX = 25;

type AntennaeType = "tv" | "radio" | null;

type Props = {
  item: OrbitItem;
  position: { x: number; y: number };
  size: number;
  viewScale: number;
  centerColor: string;
  carouselIndex: Record<number, number>;
  isVisitedTopic: boolean;
  isVisitedPost: boolean;
  isDeepRead: boolean;
  onBack: () => void;
  onHome: () => void;
  onPaginate: () => void;
  onTopicClick: (label: string, color: string) => void;
  onPostClick: (post: Post) => void;
  onContextMenuPost: (post: Post, clientX: number, clientY: number) => void;
  onHoverEnter: (post: Post, clientX: number, clientY: number) => void;
  onHoverMove: (clientX: number, clientY: number) => void;
  onHoverLeave: () => void;
};

function antennaeFor(media: MediaType): AntennaeType {
  if (media === "video") return "tv";
  if (media === "audio") return "radio";
  return null;
}

export default function OrbitBubble(props: Props) {
  const {
    item, position, size, viewScale, centerColor, carouselIndex,
    isVisitedTopic, isVisitedPost, isDeepRead,
    onBack, onHome, onPaginate, onTopicClick, onPostClick, onContextMenuPost,
    onHoverEnter, onHoverMove, onHoverLeave,
  } = props;

  const visual: BubbleVisual = buildBubbleVisual(item, size, centerColor, carouselIndex);
  const media = item.type === "post" ? classifyMedia(item.post) : null;
  const antennae = antennaeFor(media);
  const isVideo = media === "video";
  const isImage = media === "image";
  const isAudio = media === "audio";

  const effectiveW = isVideo
    ? Math.max(size * 1.6, Math.round(VIDEO_MIN_W_PX * viewScale))
    : isImage ? Math.max(size, Math.round(IMAGE_MIN_PX * viewScale)) : size;
  const effectiveH = isVideo
    ? Math.max(size * 1.0, Math.round(VIDEO_MIN_H_PX * viewScale))
    : isImage ? Math.max(size, Math.round(IMAGE_MIN_PX * viewScale)) : size;

  const antennaH = antennae === "tv"
    ? Math.max(TV_ANTENNA_MIN_PX, Math.round(effectiveH * TV_ANTENNA_FRAC))
    : antennae === "radio"
    ? Math.max(RADIO_ANTENNA_MIN_PX, Math.round(effectiveH * RADIO_ANTENNA_FRAC))
    : 0;

  const clickHandler = clickFor(item, onBack, onHome, onPaginate, onTopicClick, onPostClick, visual.tagColor);
  const isPost = item.type === "post";
  const visitedOpacity = (isVisitedTopic || isVisitedPost) ? 0.5 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x - effectiveW / 2,
        top: position.y - effectiveH / 2 - (antennae ? antennaH : 0),
        width: effectiveW,
        height: effectiveH + (antennae ? antennaH : 0),
        transition: "transform 0.15s ease-in-out",
        transformOrigin: `center ${antennae ? (antennaH + effectiveH / 2) + "px" : "center"}`,
        zIndex: 10,
        pointerEvents: "auto",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.12)";
        if (isPost) onHoverEnter(item.post, e.clientX, e.clientY);
      }}
      onMouseMove={(e) => { if (isPost) onHoverMove(e.clientX, e.clientY); }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        onHoverLeave();
      }}
    >
      {antennae === "tv" && (
        <div data-testid="tv-antennae" style={{ position: "absolute", left: effectiveW / 2 - 10, top: 0, width: "20px", display: "flex", gap: "10px", pointerEvents: "none", zIndex: 11 }}>
          <div style={{ width: "2px", height: antennaH + "px", background: "#999", transform: "rotate(-30deg)", transformOrigin: "bottom" }} />
          <div style={{ width: "2px", height: antennaH + "px", background: "#999", transform: "rotate(30deg)", transformOrigin: "bottom" }} />
        </div>
      )}
      {antennae === "radio" && (
        <div data-testid="radio-antenna" style={{ position: "absolute", right: 10, top: 0, pointerEvents: "none", zIndex: 11 }}>
          <div style={{ width: "2px", height: antennaH + "px", background: "#aaa", transform: "rotate(15deg)", transformOrigin: "bottom" }} />
        </div>
      )}
      <button
        onClick={clickHandler}
        onContextMenu={(e) => {
          e.preventDefault();
          if (isPost) onContextMenuPost(item.post, e.clientX, e.clientY);
        }}
        title={item.label}
        style={{
          position: "absolute",
          left: 0,
          top: antennae ? antennaH : 0,
          width: effectiveW,
          height: effectiveH,
          borderRadius: isVideo ? "12px" : isImage ? "4px" : isAudio ? "16px" : "50%",
          backgroundColor: visual.bgColor,
          border: isImage ? "4px solid #d4a017" : visual.border,
          boxSizing: "border-box",
          color: "#fff",
          fontSize: visual.fontSize,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "8px",
          overflow: "hidden",
          lineHeight: 1.2,
          boxShadow: [
            // Deep-read glow — sits outside the border so it's obvious even
            // on gold-framed image bubbles.
            isDeepRead ? "0 0 0 4px #ffd700, 0 0 24px 8px rgba(255,215,0,0.7)" : null,
            visual.baseShadow,
          ].filter(Boolean).join(", "),
          opacity: visitedOpacity,
          zIndex: 10,
          wordBreak: "break-word",
          pointerEvents: "auto",
        }}
      >
        {visual.content}
        {(isVisitedTopic || isVisitedPost) && (
          <span data-testid="visited-indicator" style={{ position: "absolute", top: "2px", right: "2px", fontSize: "10px", background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✓
          </span>
        )}
      </button>
    </div>
  );
}

// ── Click routing ────────────────────────────────────────────────────────────

function clickFor(
  item: OrbitItem,
  onBack: () => void,
  onHome: () => void,
  onPaginate: () => void,
  onTopicClick: (label: string, color: string) => void,
  onPostClick: (post: Post) => void,
  tagColor?: string,
): () => void {
  if (item.type === "back") return onBack;
  if (item.type === "balloon") return onHome;
  if (item.type === "paginate") return onPaginate;
  if (item.type === "subcategory" || item.type === "micro") {
    return () => onTopicClick(item.label, tagColor ?? "#8e44ad");
  }
  return () => onPostClick(item.post);
}
