"use client";
import React from "react";
import type { PostSourceMetadata } from "@/types/post";

type Props = {
  source: PostSourceMetadata;
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontWeight: 600,
  color: "#a29bfe",
  background: "#f4f1ff",
  border: "1px solid #e0d8ff",
  borderRadius: 4,
  padding: "2px 8px",
  marginLeft: 5,
  marginTop: 2,
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const linkStyle: React.CSSProperties = {
  ...badgeStyle,
  textDecoration: "none",
};

/**
 * Small "Reddit · r/python"-style pill rendered above a scraped post's body.
 * When the source has a URL, the badge acts as a link to the source page; when
 * it does not, the badge renders as a plain inline element.
 */
export default function PostSourceBadge({ source }: Props) {
  if (!source?.label) return null;
  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {source.label}
      </a>
    );
  }
  return <span style={badgeStyle}>{source.label}</span>;
}
