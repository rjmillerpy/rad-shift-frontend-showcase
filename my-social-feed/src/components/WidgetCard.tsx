"use client";
import React, { useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import type { WidgetInfo } from "@/types/post";

interface WidgetCardProps {
  widget: WidgetInfo;
  defaultWidth?: number;
  defaultHeight?: number;
}

function WidgetCard({ widget, defaultWidth = 400, defaultHeight = 300 }: WidgetCardProps) {
  const [expanded, setExpanded] = useState(false);

  const iframeW = expanded ? Math.min(800, defaultWidth * 1.8) : defaultWidth;
  const iframeH = expanded ? Math.min(600, defaultHeight * 1.8) : defaultHeight;

  const bg = "#13131a";
  const border = "#23232f";
  const accent = "#6c5ce7";
  const textPrimary = "#e0e0e0";
  const textSecondary = "#888";

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      overflow: "hidden",
      transition: "all 0.2s",
    }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${border}` }}>
        <span style={{ fontSize: 22 }}>{widget.icon_emoji || "\u{1F9E9}"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/widgets/${widget.id}`} style={{ fontWeight: 600, fontSize: 14, color: textPrimary, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {widget.title}
          </Link>
          <div style={{ fontSize: 11, color: textSecondary }}>by {widget.author_username}</div>
        </div>
        <span style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 10,
          background: "#1a1a2e",
          color: accent,
          whiteSpace: "nowrap",
        }}>
          {widget.install_count} installs
        </span>
      </div>

      {/* Description */}
      {widget.description && (
        <div style={{ padding: "6px 14px", fontSize: 12, color: textSecondary, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {widget.description}
        </div>
      )}

      {/* Sandboxed iframe */}
      <div style={{ padding: "8px 14px 10px", textAlign: "center" }}>
        <iframe
          src={`${API_URL}/widgets/${widget.id}/render`}
          sandbox="allow-scripts allow-forms"
          style={{
            width: iframeW,
            maxWidth: "100%",
            height: iframeH,
            border: `1px solid ${border}`,
            borderRadius: 8,
            background: "#fff",
            display: "block",
            margin: "0 auto",
            transition: "all 0.2s",
          }}
          title={widget.title}
          loading="lazy"
        />
      </div>

      {/* Footer */}
      <div style={{ padding: "6px 14px 10px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent",
            border: `1px solid ${border}`,
            borderRadius: 6,
            color: textSecondary,
            cursor: "pointer",
            padding: "3px 10px",
            fontSize: 11,
            fontFamily: "inherit",
          }}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
    </div>
  );
}

export default React.memo(WidgetCard);
