"use client";
import React from "react";

const IDK_GOAL_LABEL = "Just exploring 🧐";

type Props = {
  onGoalSet: (goal: string) => void;
  onSkip: () => void;
};

/** Full-screen modal shown once on entering the bubbles feed. Prompts the
    user to name an intention so they browse more mindfully. Two escape
    hatches: an "I don't know" preset and a plain Skip. */
export default function SessionGoalPrompt({ onGoalSet, onSkip }: Props) {
  return (
    <div
      data-testid="goal-prompt"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 2000,
      }}
    >
      <div style={{
        background: "#1a1a1a", borderRadius: "12px", padding: "24px",
        maxWidth: "400px", width: "90%", color: "#fff", textAlign: "center",
      }}>
        <h3 style={{ margin: "0 0 12px" }}>What are you looking for?</h3>
        <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>
          Setting an intention helps you browse more mindfully.
        </p>
        <input
          type="text"
          placeholder="e.g. Learn about AI, find music recommendations..."
          data-testid="goal-input"
          style={{
            width: "100%", padding: "10px", borderRadius: "6px",
            border: "1px solid #444", background: "#222", color: "#fff",
            fontSize: "14px", marginBottom: "12px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) onGoalSet(value);
            }
          }}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={() => onGoalSet(IDK_GOAL_LABEL)}
            data-testid="idk-button"
            style={{
              padding: "8px 16px", background: "#333", border: "1px solid #555",
              color: "#fff", borderRadius: "6px", cursor: "pointer",
            }}
          >
            I don&apos;t know
          </button>
          <button
            onClick={onSkip}
            style={{
              padding: "8px 16px", background: "none", border: "1px solid #555",
              color: "#888", borderRadius: "6px", cursor: "pointer",
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
