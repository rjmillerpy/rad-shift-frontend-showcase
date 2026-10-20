"use client";
import React from "react";

type Props = {
  testId: string;
  title: string;
  onClick: () => void;
  bottom: number;
  background: string;
  color: string;
  border: string;
  fontSize: number;
  label: string;
};

/** Small round floating action button used for the "new post" (+) and
    "log in" affordances on the bubbles page. Vertical position varies so
    the two buttons stack rather than overlap when both are visible. */
export default function FabButton({
  testId, title, onClick, bottom, background, color, border, fontSize, label,
}: Props) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      data-testid={testId}
      style={{
        position: "fixed", bottom: `${bottom}px`, right: "30px",
        width: "56px", height: "56px", borderRadius: "50%",
        backgroundColor: background, color, border,
        fontSize: `${fontSize}px`, fontWeight: "bold", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 1100,
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}
