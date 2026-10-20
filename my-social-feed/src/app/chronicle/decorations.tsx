"use client";
import React from "react";

// Small decorative components that give the chronicle page its "book" feel.
// Kept together because they're all pure presentational units with a shared
// serif-and-parchment style.

export const DropCap = ({ letter }: { letter: string }) => (
  <span style={{
    float: "left",
    fontSize: "72px",
    lineHeight: "60px",
    paddingRight: "8px",
    paddingTop: "4px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#5c3d2e",
    fontWeight: "bold",
  }}>
    {letter}
  </span>
);

export const ChapterDivider = () => (
  <div style={{
    textAlign: "center",
    margin: "32px 0",
    color: "#8b7355",
    fontSize: "18px",
    letterSpacing: "8px",
  }}>
    ✦ ✦ ✦
  </div>
);

export const PageNumber = ({ num }: { num: number }) => (
  <div style={{
    textAlign: "center",
    color: "#8b7355",
    fontSize: "14px",
    fontFamily: "'Georgia', serif",
    marginTop: "24px",
    paddingTop: "12px",
    borderTop: "1px solid #d4c5a9",
  }}>
    — {num} —
  </div>
);
