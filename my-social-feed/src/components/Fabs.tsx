"use client";
import React from "react";
import { useRouter } from "next/navigation";

/** The round floating action buttons stacked bottom-right. Each page decides
    the stacking (bottom offset); the buttons themselves look the same everywhere. */

const FAB_BASE: React.CSSProperties = {
  position: "fixed",
  right: "30px",
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  cursor: "pointer",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function SearchFab({ bottom }: Readonly<{ bottom: string }>) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/search")}
      title="Search"
      aria-label="Search"
      style={{
        ...FAB_BASE,
        bottom,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <img src="/search.png" alt="Search" width={84} height={84} style={{ objectFit: "cover" }} />
    </button>
  );
}

export function NewPostFab({ bottom, onClick }: Readonly<{ bottom: string; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      title="New post"
      aria-label="New post"
      style={{
        ...FAB_BASE,
        bottom,
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        fontSize: "28px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        lineHeight: 1,
      }}
    >
      +
    </button>
  );
}
