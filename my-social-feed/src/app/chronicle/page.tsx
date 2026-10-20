"use client";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import FloatingButtons from "@/components/FloatingButtons";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";
import { CHRONICLE_TITLE_KEY, DEFAULT_UNTITLED } from "./types";
import { ChapterDivider, PageNumber } from "./decorations";
import TitlePrompt from "./TitlePrompt";
import LoadingState from "./LoadingState";
import ChapterContent from "./ChapterContent";
import { PostTooltip, ContextMenu } from "./PostInteractions";
import { useChronicleStream } from "./useChronicleStream";

export default function ChroniclePage() {
  const { token } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [storyTitle, setStoryTitle] = useState<string | null>(null);
  const [showTitlePrompt, setShowTitlePrompt] = useState(true);
  const [hoveredPostId, setHoveredPostId] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [contextPost, setContextPost] = useState<Post | null>(null);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  const {
    chapters, loading, generating, setChapters, fetchChapter, closeStream,
  } = useChronicleStream(token);

  // On mount, restore any previously-chosen title from sessionStorage so
  // navigating away and back doesn't re-prompt.
  useEffect(() => {
    const savedTitle = sessionStorage.getItem(CHRONICLE_TITLE_KEY);
    if (savedTitle) {
      setStoryTitle(savedTitle);
      setShowTitlePrompt(false);
      fetchChapter(0);
    }
    setInitialized(true);
    // Only fires once on mount — fetchChapter changes with token but we don't
    // want to re-fetch every time it recomputes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure the EventSource is closed if the user navigates away mid-stream.
  useEffect(() => closeStream, [closeStream]);

  // Kick off the first chapter fetch once auth + title are resolved.
  useEffect(() => {
    if (initialized && !showTitlePrompt && chapters.length === 0 && !loading) {
      fetchChapter(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, showTitlePrompt]);

  const handleTitleSubmit = (raw: string) => {
    const title = raw.trim() || DEFAULT_UNTITLED;
    setStoryTitle(title);
    sessionStorage.setItem(CHRONICLE_TITLE_KEY, title);
    setShowTitlePrompt(false);
    fetchChapter(0);
  };

  const handleReact = useCallback(async (postId: number, action: string) => {
    if (!token) return;
    try {
      const res = await api.post(`/posts/${action}/${postId}`);
      setChapters((prev) => prev.map((ch) => ({
        ...ch,
        posts: ch.posts.map((p) => {
          if (p.id !== postId) return p;
          if (action === "like") return { ...p, likes: res.data.likes, liked_by_me: res.data.action === "liked" };
          if (action === "laugh") return { ...p, laughs: res.data.laughs, laughed_by_me: res.data.action === "laughed" };
          if (action === "save") return { ...p, saves: res.data.saves, saved_by_me: res.data.action === "saved" };
          return p;
        }),
      })));
    } catch (e) {
      console.error("React failed:", e);
    }
  }, [token, setChapters]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    if (!chapters[page]) fetchChapter(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = () => {
    setChapters([]);
    setCurrentPage(0);
    fetchChapter(0);
  };

  const handlePostHover = (postId: number, rect: DOMRect) => {
    setHoveredPostId(postId);
    setTooltipPos({ x: rect.left, y: rect.top });
  };

  const handlePostLeave = (relatedTarget: EventTarget | null) => {
    // Keep the tooltip open if the user moved into it (mouseleave fires when
    // moving from the highlighted span into the tooltip itself).
    const related = relatedTarget as HTMLElement | null;
    if (related?.closest?.("[data-testid='post-tooltip']")) return;
    setHoveredPostId(null);
  };

  const chapter = chapters[currentPage];
  const hoveredPost = hoveredPostId !== null && chapter
    ? chapter.posts.find((p) => p.id === hoveredPostId) ?? null
    : null;

  if (showTitlePrompt) return <TitlePrompt onSubmit={handleTitleSubmit} />;
  if (loading && !chapter) return <LoadingState />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #2c1810 0%, #1a0f0a 100%)",
      padding: "24px 0",
    }}>
      <FloatingButtons feedSettingsPath="/settings/chronicle" />

      <div style={{
        maxWidth: "700px",
        margin: "0 auto",
        background: "#f5f0e8",
        borderRadius: "4px 12px 12px 4px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset -2px 0 6px rgba(0,0,0,0.1)",
        padding: "48px 56px",
        minHeight: "80vh",
        position: "relative",
        borderLeft: "6px solid #c4b5a0",
      }}>
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0, width: "20px",
          background: "linear-gradient(90deg, rgba(0,0,0,0.08), transparent)",
          pointerEvents: "none",
        }} />

        {currentPage === 0 && storyTitle && (
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{
              fontFamily: "'Georgia', serif",
              fontSize: "32px",
              color: "#3c2415",
              marginBottom: "4px",
              fontWeight: "normal",
              letterSpacing: "2px",
            }}>
              {storyTitle}
            </h1>
            <p style={{ fontFamily: "'Georgia', serif", fontSize: "13px", color: "#8b7355", fontStyle: "italic" }}>
              A Chronicle of the Feed
            </p>
            <ChapterDivider />
          </div>
        )}

        <h2 style={{
          fontFamily: "'Georgia', serif",
          fontSize: "20px",
          color: "#5c3d2e",
          textAlign: "center",
          marginBottom: "24px",
          fontWeight: "normal",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}>
          Chapter {currentPage + 1}
        </h2>

        {hoveredPost && (
          <PostTooltip
            post={hoveredPost}
            x={tooltipPos.x}
            y={tooltipPos.y}
            onReact={handleReact}
            onClose={() => setHoveredPostId(null)}
          />
        )}

        {contextPost && (
          <ContextMenu
            post={contextPost}
            x={contextPos.x}
            y={contextPos.y}
            onReact={handleReact}
            onClose={() => setContextPost(null)}
          />
        )}

        <ChapterContent
          chapter={chapter}
          generating={generating}
          hoveredPostId={hoveredPostId}
          onPostHover={handlePostHover}
          onPostLeave={handlePostLeave}
          onPostContextMenu={(post, x, y) => { setContextPost(post); setContextPos({ x, y }); }}
        />

        <PageNumber num={currentPage + 1} />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", fontFamily: "'Georgia', serif" }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            data-testid="prev-page"
            style={{
              padding: "8px 20px",
              background: "none",
              border: "1px solid #c4b5a0",
              borderRadius: "4px",
              color: currentPage === 0 ? "#d4c5a9" : "#5c3d2e",
              cursor: currentPage === 0 ? "default" : "pointer",
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
            }}
          >
            ← Previous Page
          </button>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={!chapter?.has_more}
            data-testid="next-page"
            style={{
              padding: "8px 20px",
              background: "none",
              border: "1px solid #c4b5a0",
              borderRadius: "4px",
              color: !chapter?.has_more ? "#d4c5a9" : "#5c3d2e",
              cursor: !chapter?.has_more ? "default" : "pointer",
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
            }}
          >
            Next Page →
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            onClick={refresh}
            data-testid="refresh-btn"
            style={{
              padding: "6px 16px",
              background: "none",
              border: "none",
              color: "#8b7355",
              cursor: "pointer",
              fontFamily: "'Georgia', serif",
              fontSize: "12px",
              fontStyle: "italic",
            }}
          >
            ↻ Request a new chronicle
          </button>
        </div>
      </div>
    </div>
  );
}
