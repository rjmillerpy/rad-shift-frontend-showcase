"use client";
import React, { useState } from "react";

type Props = {
  onSubmit: (title: string) => void;
};

export default function TitlePrompt({ onSubmit }: Props) {
  const [titleInput, setTitleInput] = useState("");

  const handleSubmit = () => onSubmit(titleInput.trim());

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #2c1810 0%, #1a0f0a 100%)",
    }}>
      <div data-testid="title-prompt" style={{
        background: "#f5f0e8",
        borderRadius: "8px",
        padding: "48px",
        maxWidth: "480px",
        width: "90%",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        border: "2px solid #d4c5a9",
      }}>
        <h1 style={{
          fontFamily: "'Georgia', serif",
          fontSize: "28px",
          color: "#3c2415",
          marginBottom: "8px",
        }}>
          Chronicle
        </h1>
        <p style={{
          fontFamily: "'Georgia', serif",
          fontSize: "14px",
          color: "#8b7355",
          marginBottom: "24px",
          fontStyle: "italic",
        }}>
          Name your story. What do you think it will be about?
        </p>
        <input
          type="text"
          data-testid="title-input"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="The tale of..."
          autoFocus
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "18px",
            fontFamily: "'Georgia', serif",
            border: "1px solid #c4b5a0",
            borderRadius: "4px",
            background: "#fffdf8",
            color: "#3c2415",
            textAlign: "center",
            marginBottom: "16px",
          }}
        />
        <button
          data-testid="title-submit"
          onClick={handleSubmit}
          style={{
            padding: "10px 32px",
            fontSize: "16px",
            fontFamily: "'Georgia', serif",
            background: "#5c3d2e",
            color: "#f5f0e8",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Begin Reading
        </button>
      </div>
    </div>
  );
}
