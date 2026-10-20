"use client";
import React from "react";
import type { NavHistoryEntry, TopicDef } from "./types";
import type { Post } from "@/types/post";

// Focus timer color flip point — below this, the user has been in the topic
// for less than half a minute, so we nudge them to slow down and stay longer.
const FOCUS_TIMER_STAY_LONGER_THRESHOLD_S = 30;

// After 5 depth levels the raw dot pattern gets unwieldy — cap the emojis
// and show a "+N" suffix for anything deeper.
const DEPTH_INDICATOR_MAX_DOTS = 5;

const HISTORY_POST_PREVIEW_CHARS = 20;
const HEADER_TOPIC_PREVIEW_CHARS = 25;

type Props = {
  navHistory: NavHistoryEntry[];
  selectedTopic: TopicDef | null;
  selectedPost: Post | null;
  sessionGoal: string | null;
  focusTimer: number;
  depthLevel: number;
  onTakeBreak: () => void;
};

function formatTimer(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Top bar that renders while the user is in a drilled-in constellation.
    Shows the breadcrumb trail, session goal, focus timer, depth indicator,
    and a "Take a break" button to bail back to the overview. */
export default function ContextBar({
  navHistory, selectedTopic, selectedPost, sessionGoal, focusTimer, depthLevel, onTakeBreak,
}: Props) {
  const timerColor = focusTimer < FOCUS_TIMER_STAY_LONGER_THRESHOLD_S ? "#e74c3c" : "#2ecc71";
  const currentLabel = selectedPost
    ? selectedPost.text.slice(0, HEADER_TOPIC_PREVIEW_CHARS) + "…"
    : selectedTopic?.label;

  return (
    <div
      data-testid="context-bar"
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        background: "rgba(10,10,10,0.85)", backdropFilter: "blur(8px)",
        padding: "8px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", zIndex: 1500, fontSize: "13px",
        borderBottom: "1px solid #333",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#aaa" }}>
        {sessionGoal && (
          <span data-testid="session-goal" style={{ color: "#f1c40f", marginRight: "8px" }}>
            🎯 {sessionGoal}
          </span>
        )}
        <span style={{ color: "#666" }}>Path:</span>
        {navHistory.map((h, i) => (
          <span key={i}>
            <span style={{ color: h.topic?.color || "#888" }}>
              {h.post
                ? h.post.text.slice(0, HISTORY_POST_PREVIEW_CHARS) + "…"
                : h.topic?.label || "Overview"}
            </span>
            <span style={{ color: "#555", margin: "0 2px" }}> → </span>
          </span>
        ))}
        <span style={{ color: selectedTopic?.color || "#fff", fontWeight: "bold" }}>
          {currentLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span data-testid="focus-timer" style={{ color: timerColor, fontFamily: "monospace", fontSize: "14px" }}>
          ⏱ {formatTimer(focusTimer)}
          {focusTimer < FOCUS_TIMER_STAY_LONGER_THRESHOLD_S && (
            <span style={{ color: "#e74c3c", marginLeft: "4px", fontSize: "11px" }}>stay longer</span>
          )}
        </span>

        <span data-testid="depth-indicator" style={{ color: "#aaa" }}>
          {"🔵".repeat(Math.min(depthLevel, DEPTH_INDICATOR_MAX_DOTS))}
          {depthLevel > DEPTH_INDICATOR_MAX_DOTS && ` +${depthLevel - DEPTH_INDICATOR_MAX_DOTS}`}
        </span>

        <button
          data-testid="take-break"
          onClick={onTakeBreak}
          style={{
            background: "#e74c3c", border: "none", color: "#fff",
            padding: "4px 12px", borderRadius: "12px", fontSize: "11px", cursor: "pointer",
          }}
        >
          Take a break
        </button>
      </div>
    </div>
  );
}
