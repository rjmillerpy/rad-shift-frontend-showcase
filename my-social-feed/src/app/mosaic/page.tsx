"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import FloatingButtons from "@/components/FloatingButtons";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { normalizePosts } from "@/lib/postUtils";
import { MOSAIC_PAGE_SIZE } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";

const MOSAIC_TABS = ["algo", "following"] as const;
type MosaicTab = (typeof MOSAIC_TABS)[number];

// Text truncation caps for tile and hover overlay. Kept named so a designer
// can tune wrapping without hunting through the render tree.
const TILE_TEXT_CHARS = 80;
const HOVER_TEXT_CHARS = 60;

// Deterministic vivid color per post ID. Uniqueness is per-post so no two
// adjacent tiles share a hue, even if the same user made both.
const tileColor = (postId: number) => {
  // Multiply by golden-ratio-ish 137 to spread adjacent IDs across the hue wheel.
  const h = (postId * 137) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

// Fraction of the tile that becomes the visible colored frame around the
// photo. 6% on each side leaves a clear border without shrinking the image.
const FRAME_INSET = "6%";

// Pointy-top hexagon clip-path (slightly inset for 2px visual gap between tiles)
const HEXAGON_CLIP = "polygon(50% 1%, 99% 25.5%, 99% 74.5%, 50% 99%, 1% 74.5%, 1% 25.5%)";

// Honeycomb layout constants
const HEX_W = 200;  // bounding box width
const HEX_H = 230;  // bounding box height (taller for proper hex proportions)
const COLS = 5;      // tiles per even row

// Calculate the absolute pixel position for post at a given linear index
const hexPosition = (index: number) => {
  let row = 0;
  let remaining = index;
  while (true) {
    const colsInRow = row % 2 === 0 ? COLS : COLS - 1;
    if (remaining < colsInRow) {
      const col = remaining;
      const isOdd = row % 2 === 1;
      return {
        x: col * HEX_W + (isOdd ? HEX_W / 2 : 0),
        y: row * (HEX_H * 0.75),
        row,
      };
    }
    remaining -= colsInRow;
    row++;
  }
};

// Total number of rows for N posts
const totalRows = (n: number) => {
  let row = 0;
  let placed = 0;
  while (placed < n) {
    placed += row % 2 === 0 ? COLS : COLS - 1;
    row++;
  }
  return row;
};

export default function MosaicPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [hoveredPost, setHoveredPost] = useState<number | null>(null);
  const [tab, setTab] = useState<MosaicTab>("algo");

  const fetchPosts = useCallback(async (offset: number) => {
    setLoading(offset === 0);
    try {
      const endpoint = tab === "following" ? "/posts/following" : "/posts/algo";
      const res = await api.get(endpoint, {
        params: { offset, limit: MOSAIC_PAGE_SIZE },
      });
      const fetched = normalizePosts(res.data.posts);
      setPosts((prev) => offset === 0 ? fetched : [...prev, ...fetched]);
      setHasMore(res.data.has_more ?? false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    void fetchPosts(0);
  }, [tab, token, fetchPosts]);

  const numRows = posts.length > 0 ? totalRows(posts.length) : 0;
  const gridHeight = numRows > 0 ? (numRows - 1) * (HEX_H * 0.75) + HEX_H : 0;
  const gridWidth = COLS * HEX_W;

  return (
    <div style={{ minHeight: "100vh", background: "#111" }}>
      <FloatingButtons feedSettingsPath="/settings/mosaic" />

      {/* Header */}
      <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 28, fontWeight: "bold" }}>Mosaic</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {MOSAIC_TABS.map((t) => (
              <button key={t} data-testid={`tab-${t}`}
                onClick={() => { setTab(t); setPosts([]); }}
                style={{
                  padding: "6px 16px", border: "1px solid #333", borderRadius: 20,
                  background: tab === t ? "#fff" : "transparent", color: tab === t ? "#111" : "#888",
                  cursor: "pointer", fontSize: 13, textTransform: "capitalize",
                }}>
                {t === "algo" ? "Discover" : "Following"}
              </button>
            ))}
          </div>
        </div>

        {loading && posts.length === 0 && (
          <div style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading mosaic...</div>
        )}

        {!loading && posts.length === 0 && (
          <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No posts to display.</div>
        )}

        {/* Honeycomb grid */}
        <div
          data-testid="mosaic-grid"
          style={{
            position: "relative",
            width: gridWidth,
            height: gridHeight,
            margin: "0 auto",
          }}
        >
          {posts.map((post, idx) => {
            const { x, y } = hexPosition(idx);
            const isHovered = hoveredPost === post.id;
            const hasImage = !!(post.image_url || (post.image_urls && post.image_urls.length > 0));
            const mainImage = post.image_urls?.[0] || post.image_url;

            return (
              <Link
                key={post.id}
                data-testid={`tile-${post.id}`}
                data-hex-x={x}
                data-hex-y={y}
                href={`/post/${post.id}`}
                aria-label={`Open post by ${post.username}`}
                onMouseEnter={() => setHoveredPost(post.id)}
                onMouseLeave={() => setHoveredPost(null)}
                style={{
                  position: "absolute",
                  display: "block",
                  left: x,
                  top: y,
                  width: HEX_W,
                  height: HEX_H,
                  clipPath: HEXAGON_CLIP,
                  WebkitClipPath: HEXAGON_CLIP,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: tileColor(post.id),
                  transition: "transform 0.2s, filter 0.2s",
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                  filter: isHovered ? "drop-shadow(0 8px 16px rgba(0,0,0,0.6))" : "none",
                  zIndex: isHovered ? 10 : 1,
                }}
              >
                {/* Background image — nested hex clip inset by FRAME_INSET so
                    the outer color always shows as a frame around the photo. */}
                {hasImage && mainImage && (
                  <div style={{
                    position: "absolute",
                    inset: FRAME_INSET,
                    clipPath: HEXAGON_CLIP,
                    WebkitClipPath: HEXAGON_CLIP,
                    overflow: "hidden",
                  }}>
                    <img src={mainImage} alt="" crossOrigin="anonymous"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                )}

                {/* Video indicator */}
                {post.video_url && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 0, height: 0, borderLeft: "16px solid #fff", borderTop: "10px solid transparent", borderBottom: "10px solid transparent", marginLeft: 4 }} />
                  </div>
                )}

                {/* Audio indicator */}
                {post.audio_url && !hasImage && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 36 }}>🎵</div>
                )}

                {/* Text for non-image posts */}
                {!hasImage && (
                  <div style={{ position: "absolute", inset: "26% 10% 26% 10%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.3, textAlign: "center", margin: 0, overflow: "hidden", maxHeight: "100%" }}>
                      {post.text.length > TILE_TEXT_CHARS ? post.text.slice(0, TILE_TEXT_CHARS) + "…" : post.text}
                    </p>
                  </div>
                )}

                {/* Hover overlay */}
                {isHovered && (
                  <div data-testid={`hover-${post.id}`} style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.75)",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    alignItems: "center", padding: "28% 12%",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <img src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)} alt=""
                        style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>{post.username}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, lineHeight: 1.2, margin: "0 0 4px 0", textAlign: "center" }}>
                      {post.text.length > HOVER_TEXT_CHARS ? post.text.slice(0, HOVER_TEXT_CHARS) + "…" : post.text}
                    </p>
                    <div style={{ display: "flex", gap: 6, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                      <span>❤️ {post.likes}</span>
                      <span>😂 {post.laughs ?? 0}</span>
                      <span>🔁 {post.reposts}</span>
                    </div>
                  </div>
                )}

                {/* Username badge */}
                <div style={{
                  position: "absolute", bottom: "28%", left: "50%", transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  fontSize: 9, padding: "1px 6px", borderRadius: 8,
                  whiteSpace: "nowrap",
                  display: isHovered ? "none" : "block",
                }}>
                  @{post.username}
                </div>

                {/* Multi-image indicator */}
                {post.image_urls && post.image_urls.length > 1 && (
                  <div style={{
                    position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.6)", color: "#fff",
                    fontSize: 9, padding: "1px 5px", borderRadius: 6,
                  }}>
                    📷 {post.image_urls.length}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: "center", padding: 24, marginTop: 16 }}>
            <button data-testid="load-more" onClick={() => fetchPosts(posts.length)}
              style={{ padding: "10px 24px", background: "#222", color: "#aaa", border: "1px solid #333", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
