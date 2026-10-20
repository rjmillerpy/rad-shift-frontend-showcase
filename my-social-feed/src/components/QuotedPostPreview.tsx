"use client";
import React, { useState } from "react";
import Link from "next/link";
import type { QuotedPost } from "@/types/post";

type Props = {
  quotedPost: QuotedPost;
};

const QUOTE_TRUNCATE_AT = 160;
const OPEN_QUOTE = "❝";
const CLOSE_QUOTE = "❞";
const ELLIPSIS = "…";

function renderQuoteBody(text: string): string {
  if (text.length <= QUOTE_TRUNCATE_AT) {
    return `${OPEN_QUOTE}${text}${CLOSE_QUOTE}`;
  }
  return `${OPEN_QUOTE}${text.slice(0, QUOTE_TRUNCATE_AT)}${ELLIPSIS}${CLOSE_QUOTE}`;
}

export default function QuotedPostPreview({ quotedPost }: Props) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/post/${quotedPost.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          marginLeft: "5px",
          marginTop: "4px",
          padding: "6px 8px",
          borderLeft: hovered ? "3px solid #007bff" : "3px solid #ccc",
          borderRadius: 4,
          background: hovered ? "#e8f0fe" : "#fafafa",
          fontSize: "12px",
          color: "#555",
          cursor: "pointer",
          transition: "background 0.15s ease-in-out, border-color 0.15s ease-in-out",
        }}
      >
        <div style={{ fontWeight: "bold" }}>Quoting @{quotedPost.username}</div>
        <div style={{ whiteSpace: "pre-wrap" }}>{renderQuoteBody(quotedPost.text)}</div>
      </div>
    </Link>
  );
}
