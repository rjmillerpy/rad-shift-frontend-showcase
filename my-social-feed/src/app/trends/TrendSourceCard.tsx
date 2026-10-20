"use client";
import React from "react";
import type { SourceTrends } from "@/types/trends";

type Props = { bundle: SourceTrends };

const MAX_VISIBLE_ITEMS = 50;

const SOURCE_ACCENT: Record<string, string> = {
  trends24: "#1da1f2",
  google: "#4285f4",
  reddit: "#ff4500",
  hackernews: "#ff6600",
};

function formatAge(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function TrendSourceCard({ bundle }: Props) {
  const accent = SOURCE_ACCENT[bundle.source] || "#1abc9c";
  const visible = bundle.items.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <section style={cardStyle} aria-labelledby={`trends-${bundle.source}`}>
      <header style={headerStyle}>
        <div>
          <h2 id={`trends-${bundle.source}`} style={{ ...titleStyle, color: accent }}>
            {bundle.label}
          </h2>
          <p style={subtitleStyle}>
            Updated {formatAge(bundle.fetched_at)} · {bundle.items.length} items
          </p>
        </div>
      </header>

      {bundle.error ? (
        <p style={errorStyle}>{bundle.error}</p>
      ) : visible.length === 0 ? (
        <p style={emptyStyle}>No trends available.</p>
      ) : (
        <ol style={listStyle}>
          {visible.map((item) => (
            <TrendRow key={`${item.source}-${item.rank}`} item={item} accent={accent} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TrendRow({ item, accent }: { item: SourceTrends["items"][number]; accent: string }) {
  const body = (
    <>
      <span style={{ ...rankStyle, color: accent }}>#{item.rank}</span>
      <span style={keywordStyle}>{item.keyword}</span>
      {item.volume && <span style={volumeStyle}>{item.volume}</span>}
    </>
  );
  if (item.url) {
    return (
      <li style={rowStyle}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {body}
        </a>
      </li>
    );
  }
  return <li style={rowStyle}>{body}</li>;
}

const cardStyle: React.CSSProperties = {
  background: "#13131a", border: "1px solid #23232f", borderRadius: 12,
  padding: 18, display: "flex", flexDirection: "column", gap: 12,
};
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700 };
const subtitleStyle: React.CSSProperties = { margin: "4px 0 0", fontSize: 12, color: "#666" };
const listStyle: React.CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 8 };
const linkStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 8, textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 };
const rankStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, minWidth: 28, lineHeight: 1.4 };
// Wrap long titles onto a second line with a trailing ellipsis. `minWidth: 0`
// is the classic fix for a flex child that would otherwise refuse to shrink
// below its intrinsic content width and push siblings off-screen.
const keywordStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e0e0e0",
  flex: 1,
  minWidth: 0,
  lineHeight: 1.4,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  wordBreak: "break-word",
};
const volumeStyle: React.CSSProperties = { fontSize: 11, color: "#888", whiteSpace: "nowrap", lineHeight: 1.4 };
const errorStyle: React.CSSProperties = { color: "#e67e22", fontSize: 13, margin: 0 };
const emptyStyle: React.CSSProperties = { color: "#666", fontSize: 13, margin: 0 };

export default React.memo(TrendSourceCard);
