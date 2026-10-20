"use client";
import React from "react";
import Link from "next/link";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { formatMediaTime } from "@/lib/utils";

const SEEK_STEP_SECONDS = 5; // arrow keys on the progress slider

// Cap for the truncated track-title shown in the mini-player row.
const TRACK_TITLE_PREVIEW_CHARS = 60;

export default function MiniPlayer() {
  const { track, isPlaying, currentTime, duration, pause, resume, stop, seekTo } =
    useGlobalAudio();

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayText =
    track.text.length > TRACK_TITLE_PREVIEW_CHARS
      ? track.text.slice(0, TRACK_TITLE_PREVIEW_CHARS) + "\u2026"
      : track.text;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(fraction * duration);
  };

  // The keyboard way to seek: arrows step, Home/End jump to the ends.
  const handleProgressKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    const targets: Record<string, number> = {
      ArrowRight: currentTime + SEEK_STEP_SECONDS,
      ArrowUp: currentTime + SEEK_STEP_SECONDS,
      ArrowLeft: currentTime - SEEK_STEP_SECONDS,
      ArrowDown: currentTime - SEEK_STEP_SECONDS,
      Home: 0,
      End: duration,
    };
    if (!(e.key in targets)) return;
    e.preventDefault();
    seekTo(Math.max(0, Math.min(duration, targets[e.key])));
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1a1a2e",
        borderTop: "1px solid #2d2d4a",
        zIndex: 9000,
        padding: "0 16px 8px",
      }}
    >
      {/* Progress bar: click or arrow keys to seek */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatMediaTime(currentTime)} of ${formatMediaTime(duration)}`}
        onClick={handleProgressClick}
        onKeyDown={handleProgressKey}
        style={{
          height: 3,
          background: "#2d2d4a",
          cursor: "pointer",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#6c5ce7",
            transition: "width 0.2s linear",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Play/Pause */}
        <button
          onClick={isPlaying ? pause : resume}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{
            background: "#6c5ce7",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            color: "#fff",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isPlaying ? "\u275A\u275A" : "\u25B6"}
        </button>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/post/${track.postId}`}
            style={{ textDecoration: "none", color: "#e0e0e0", fontSize: 13, fontWeight: 600 }}
          >
            @{track.username}
          </Link>
          <div
            style={{
              fontSize: 11,
              color: "#888",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayText}
          </div>
        </div>

        {/* Time */}
        <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace", flexShrink: 0 }}>
          {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
        </span>

        {/* Close */}
        <button
          onClick={stop}
          aria-label="Close player"
          title="Stop"
          style={{
            background: "none",
            border: "none",
            color: "#666",
            fontSize: 18,
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          {"\u2716"}
        </button>
      </div>
    </div>
  );
}
