"use client";
import React from "react";
import type { Bubble } from "./types";

// How much drifting overview bubbles dim while the user is drilled in.
const DIM_WHEN_ZOOMED_OPACITY = 0.25;

type Props = {
  bubble: Bubble;
  dimIfZoomed: boolean;
  onClick: () => void;
};

/** A single drifting topic bubble on the overview canvas. Positioned by the
    animation hook that owns the (x, y, size) state. */
export default function OverviewBubble({ bubble, dimIfZoomed, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title={bubble.label}
      style={{
        position: "absolute",
        left: bubble.x - bubble.size / 2,
        top: bubble.y - bubble.size / 2,
        width: bubble.size,
        height: bubble.size,
        borderRadius: "50%",
        backgroundColor: bubble.color,
        border: bubble.isFeed ? "3px solid #fff" : "2px solid rgba(255,255,255,0.3)",
        color: "#fff",
        fontSize: bubble.isFeed ? "14px" : "12px",
        fontWeight: bubble.isFeed ? "bold" : "normal",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "4px",
        boxShadow: `0 0 ${bubble.isFeed ? 20 : 10}px ${bubble.color}88`,
        transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out, opacity 0.3s ease-in-out",
        zIndex: bubble.isFeed ? 10 : 1,
        opacity: dimIfZoomed ? DIM_WHEN_ZOOMED_OPACITY : 1,
        lineHeight: 1.2,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${bubble.color}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 ${bubble.isFeed ? 20 : 10}px ${bubble.color}88`;
      }}
    >
      {bubble.label}
    </button>
  );
}
