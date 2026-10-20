"use client";
import React from "react";
import type { Post } from "@/types/post";
import type { ChapterData } from "./types";
import { DropCap } from "./decorations";

type Props = {
  chapter: ChapterData | undefined;
  generating: boolean;
  hoveredPostId: number | null;
  onPostHover: (postId: number, rect: DOMRect) => void;
  onPostLeave: (relatedTarget: EventTarget | null) => void;
  onPostContextMenu: (post: Post, clientX: number, clientY: number) => void;
};

// The main body of a chapter: narrative prose interspersed with highlighted
// post text and inline media illustrations. Rendered as continuous flowing
// text so the chronicle reads like a real book.
export default function ChapterContent({
  chapter, generating, hoveredPostId, onPostHover, onPostLeave, onPostContextMenu,
}: Props) {
  const hasContent = (chapter && chapter.segments.length > 0) || generating;

  if (!hasContent) {
    return (
      <p style={{
        fontFamily: "'Georgia', serif",
        color: "#8b7355",
        textAlign: "center",
        fontStyle: "italic",
      }}>
        No posts to chronicle yet.
      </p>
    );
  }

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: "16px",
      lineHeight: 1.8,
      color: "#2c1810",
    }}>
      {(chapter?.segments || []).map((seg, i) => {
        if (seg.type === "narrative") {
          const isFirst = i === 0 && !generating;
          const text = seg.text;
          return (
            <span key={i} data-testid="narrative-segment" style={{ color: "#5c3d2e" }}>
              {isFirst && text.length > 0 && <DropCap letter={text[0]} />}
              {isFirst ? text.slice(1) : text}{" "}
            </span>
          );
        }

        const post = chapter?.posts[seg.index];
        if (!post) return null;
        const hasMedia = !!(post.image_url || post.video_url || post.audio_url);

        return (
          <React.Fragment key={i}>
            <span
              data-testid="post-segment"
              data-post-id={post.id}
              onMouseEnter={(e) => onPostHover(post.id, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={(e) => onPostLeave(e.relatedTarget)}
              onContextMenu={(e) => { e.preventDefault(); onPostContextMenu(post, e.clientX, e.clientY); }}
              style={{
                color: "#2c1810",
                fontStyle: "normal",
                background: hoveredPostId === post.id ? "rgba(212, 197, 169, 0.4)" : "rgba(212, 197, 169, 0.15)",
                borderRadius: "2px",
                padding: "0 2px",
                cursor: "default",
                transition: "background 0.2s ease",
                borderBottom: "1px dotted rgba(139, 115, 85, 0.3)",
              }}
            >
              &ldquo;{post.text}&rdquo;
            </span>{" "}

            {hasMedia && (
              <div data-testid="media-segment" style={{ margin: "20px auto", maxWidth: "85%", position: "relative" }}>
                {post.image_url && (
                  <img src={post.image_url} alt="" crossOrigin="anonymous"
                    style={{ width: "100%", maxHeight: "360px", objectFit: "cover", display: "block",
                      border: "1px solid #d4c5a9", borderRadius: "2px" }} />
                )}
                {post.video_url && (
                  <video src={post.video_url} controls playsInline preload="metadata"
                    poster={post.image_url || undefined}
                    style={{ width: "100%", maxHeight: "360px", display: "block",
                      border: "1px solid #d4c5a9", borderRadius: "2px" }} />
                )}
                {post.audio_url && (
                  <audio src={post.audio_url} controls preload="metadata" style={{ width: "100%", marginTop: "4px" }} />
                )}
                <p style={{ textAlign: "center", fontSize: "11px", color: "#8b7355", fontStyle: "italic", marginTop: "4px" }}>
                  shared by @{post.username}
                </p>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {generating && <WritingIndicator hasSegments={(chapter?.segments?.length || 0) > 0} />}
    </div>
  );
}

function WritingIndicator({ hasSegments }: { hasSegments: boolean }) {
  return (
    <div data-testid="writing-indicator" style={{ textAlign: "center", padding: "24px 0", fontFamily: "'Georgia', serif" }}>
      {!hasSegments ? (
        <div style={{ animation: "pulse 2s ease-in-out infinite" }}>
          <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🤔</span>
          <p style={{ color: "#8b7355", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
            The chronicler is gathering thoughts...
          </p>
          <p style={{ color: "#b0a08a", fontSize: "12px", marginTop: "8px" }}>
            Weaving your posts into a story takes a moment
          </p>
        </div>
      ) : (
        <div>
          <span style={{ fontSize: "24px", display: "inline-block", animation: "write 0.5s ease-in-out infinite alternate" }}>✍️</span>
          <p style={{ color: "#8b7355", fontStyle: "italic", fontSize: "13px", margin: "4px 0 0 0" }}>
            Still writing...
          </p>
        </div>
      )}
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes write { 0% { transform: rotate(-5deg); } 100% { transform: rotate(5deg); } }
      `}</style>
    </div>
  );
}
