"use client";
import React from "react";
import { proxyIfNeeded } from "@/lib/utils";
import { buttonProps } from "@/lib/a11y";
import type { Post } from "@/types/post";
import type { TopicDef } from "./types";

// Reference viewport short-side for scaling the center bubble geometry.
const VIDEO_CENTER_MIN_W_PX = 280;
const VIDEO_CENTER_MIN_H_PX = 180;
const IMAGE_CENTER_MIN_PX = 180;
const CENTER_ANTENNA_MIN_TV_PX = 35;
const CENTER_ANTENNA_MIN_RADIO_PX = 30;

type Props = {
  selectedPost: Post | null;
  selectedTopic: TopicDef | null;
  cx: number;
  cy: number;
  viewScale: number;
  centerSize: number;
  centerColor: string;
  centerLabel: string;
  carouselIndex: Record<number, number>;
  onCarouselChange: (postId: number, next: number) => void;
  onOpenPost: (postId: number) => void;
  onContextMenu: (post: Post, clientX: number, clientY: number) => void;
};

export default function CenterBubble({
  selectedPost, selectedTopic, cx, cy, viewScale, centerSize, centerColor, centerLabel,
  carouselIndex, onCarouselChange, onOpenPost, onContextMenu,
}: Props) {
  const isPostCenter = !!selectedPost;
  const hasVideoCenter = isPostCenter && !!selectedPost!.video_url;
  const hasAudioCenter = isPostCenter && !!selectedPost!.audio_url;
  const hasImageCenter = isPostCenter && !!selectedPost!.image_url && !hasVideoCenter;
  const isMediaCenter = hasVideoCenter || hasAudioCenter || hasImageCenter;

  const mediaCenterW = hasVideoCenter
    ? Math.max(centerSize * 1.8, Math.round(VIDEO_CENTER_MIN_W_PX * viewScale))
    : hasImageCenter ? Math.max(centerSize, Math.round(IMAGE_CENTER_MIN_PX * viewScale)) : centerSize;
  const mediaCenterH = hasVideoCenter
    ? Math.max(centerSize * 1.2, Math.round(VIDEO_CENTER_MIN_H_PX * viewScale))
    : hasImageCenter ? Math.max(centerSize, Math.round(IMAGE_CENTER_MIN_PX * viewScale)) : centerSize;

  const centerAntennaH = hasVideoCenter
    ? Math.max(CENTER_ANTENNA_MIN_TV_PX, Math.round(mediaCenterH * 0.3))
    : hasAudioCenter
    ? Math.max(CENTER_ANTENNA_MIN_RADIO_PX, Math.round(centerSize * 0.25))
    : 0;

  return (
    <>
      {hasVideoCenter && (
        <div data-testid="center-tv-antennae" style={{
          position: "absolute",
          left: cx - 12,
          top: cy - mediaCenterH / 2 - centerAntennaH,
          width: "24px", display: "flex", gap: "12px",
          pointerEvents: "none", zIndex: 21,
        }}>
          <div style={{ width: "2px", height: centerAntennaH + "px", background: "#999", transform: "rotate(-30deg)", transformOrigin: "bottom" }} />
          <div style={{ width: "2px", height: centerAntennaH + "px", background: "#999", transform: "rotate(30deg)", transformOrigin: "bottom" }} />
        </div>
      )}
      {hasAudioCenter && (
        <div data-testid="center-radio-antenna" style={{
          position: "absolute",
          left: cx + centerSize / 2 - 15,
          top: cy - centerSize / 2 - centerAntennaH,
          pointerEvents: "none", zIndex: 21,
        }}>
          <div style={{ width: "2px", height: centerAntennaH + "px", background: "#aaa", transform: "rotate(15deg)", transformOrigin: "bottom" }} />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: cx - mediaCenterW / 2,
          top: cy - mediaCenterH / 2,
          width: mediaCenterW,
          height: mediaCenterH,
          borderRadius: hasVideoCenter ? "12px" : hasAudioCenter ? "16px" : hasImageCenter ? "4px" : "50%",
          backgroundColor: centerColor,
          border: hasVideoCenter ? "3px solid #444" : hasAudioCenter ? "3px solid #777" : hasImageCenter ? "4px solid #d4a017" : "3px solid #fff",
          color: "#fff",
          fontSize: isPostCenter ? "12px" : "16px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          boxShadow: isMediaCenter
            ? `0 0 30px ${centerColor}, inset 0 0 10px rgba(0,0,0,0.5)`
            : `0 0 30px ${centerColor}`,
          zIndex: 20,
          padding: isMediaCenter ? "0" : "10px",
          lineHeight: 1.2,
          overflow: "hidden",
          wordBreak: "break-word",
          cursor: isPostCenter ? "pointer" : "default",
          flexDirection: "column",
        }}
        // A post in the centre opens on click, Enter or Space. Not a <button>:
        // it contains the carousel's buttons.
        {...(isPostCenter
          ? { ...buttonProps(() => onOpenPost(selectedPost!.id)), "aria-label": "Open post" }
          : {})}
        onContextMenu={(e) => {
          if (isPostCenter) {
            e.preventDefault();
            onContextMenu(selectedPost!, e.clientX, e.clientY);
          }
        }}
        title={isPostCenter ? selectedPost!.text : selectedTopic?.label}
      >
        {hasVideoCenter && <VideoCenterContent post={selectedPost!} />}
        {hasAudioCenter && <AudioCenterContent post={selectedPost!} centerLabel={centerLabel} />}
        {hasImageCenter && (
          <ImageCenterContent
            post={selectedPost!}
            centerLabel={centerLabel}
            carouselIndex={carouselIndex}
            onCarouselChange={onCarouselChange}
          />
        )}
        {!isMediaCenter && centerLabel}
      </div>
    </>
  );
}

function VideoCenterContent({ post }: { post: Post }) {
  return (
    <video
      src={post.video_url!}
      controls
      playsInline
      preload="metadata"
      poster={post.image_url || undefined}
      style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit", display: "block", margin: "auto" }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function AudioCenterContent({ post, centerLabel }: { post: Post; centerLabel: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%", padding: "8px" }}>
      <div style={{ fontSize: "11px", lineHeight: 1.2, maxHeight: "40px", overflow: "hidden", color: "#ccc" }}>
        {centerLabel}
      </div>
      <audio
        src={post.audio_url!}
        controls
        preload="metadata"
        style={{ width: "90%", maxWidth: "160px" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function ImageCenterContent({
  post, centerLabel, carouselIndex, onCarouselChange,
}: {
  post: Post;
  centerLabel: string;
  carouselIndex: Record<number, number>;
  onCarouselChange: (postId: number, next: number) => void;
}) {
  const centerImgs = post.image_urls && post.image_urls.length > 1
    ? post.image_urls
    : [post.image_url!];
  const cIdx = (carouselIndex[post.id] || 0) % centerImgs.length;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: "inherit" }}>
      <img
        src={proxyIfNeeded(centerImgs[cIdx])}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s" }}
      />
      {centerImgs.length > 1 && (
        <>
          <button
            data-testid="center-carousel-prev"
            onClick={(e) => { e.stopPropagation(); onCarouselChange(post.id, (cIdx - 1 + centerImgs.length) % centerImgs.length); }}
            style={{ position: "absolute", left: "4px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px", zIndex: 3 }}
          >←</button>
          <button
            data-testid="center-carousel-next"
            onClick={(e) => { e.stopPropagation(); onCarouselChange(post.id, (cIdx + 1) % centerImgs.length); }}
            style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px", zIndex: 3 }}
          >→</button>
          <div style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", zIndex: 3 }}>
            {centerImgs.map((_, di) => (
              <div key={di} style={{ width: "8px", height: "8px", borderRadius: "50%", background: di === cIdx ? "#fff" : "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.3)" }} />
            ))}
          </div>
        </>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "6px 8px" }}>
        <span style={{ fontSize: "11px", color: "#fff" }}>{centerLabel}</span>
      </div>
    </div>
  );
}
