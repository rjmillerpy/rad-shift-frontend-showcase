"use client";
import React from "react";

export default function LoadingState() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #2c1810 0%, #1a0f0a 100%)",
      color: "#d4c5a9",
      fontFamily: "'Georgia', serif",
    }}>
      <div data-testid="loading-state" style={{ textAlign: "center", maxWidth: "400px", padding: "20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pulse 2s ease-in-out infinite" }}>🤔</div>
        <p style={{ fontSize: "20px", marginBottom: "8px" }}>Chronicling...</p>
        <p style={{ fontSize: "13px", color: "#8b7355", fontStyle: "italic" }}>
          The chronicler is reading through your feed, finding connections between posts, and weaving them into a narrative.
        </p>
        <p style={{ fontSize: "12px", color: "#6b5a45", marginTop: "16px" }}>
          This takes longer on local hardware. On cloud GPU it would be nearly instant.
        </p>
        <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }`}</style>
      </div>
    </div>
  );
}
