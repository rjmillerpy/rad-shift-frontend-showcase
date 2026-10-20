"use client";
import React from "react";
import { proxyIfNeeded } from "@/lib/utils";
import { getBadgeLetter, getLinkCardTheme, type LinkCardTheme } from "@/lib/linkCardThemes";
import type { PostLinkCard, PostSourceMetadata } from "@/types/post";

type Props = {
  linkCard: PostLinkCard;
  source?: PostSourceMetadata;
  /**
   * When set, rendered as the card's description block between title and
   * footer. PostCard passes the scraped post's body here so the entire
   * "post from {site}" unit reads as one embedded card.
   */
  bodyText?: string;
};

const MAX_TITLE_CHARS = 140;
const ACCENT_STRIPE_WIDTH = 4;
const TITLE_OVERLAP_CHECK_CHARS = 60;
const TITLE_OVERLAP_MIN_CHARS = 20;

function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_CHARS) return title;
  return `${title.slice(0, MAX_TITLE_CHARS).trimEnd()}…`;
}

/**
 * Pinterest's RSS reuses the description as the entry title, so we'd otherwise
 * render the same content twice (title + body). Return true when the title is
 * effectively a prefix of the body, so the caller can suppress the title slot.
 * A short title (under TITLE_OVERLAP_MIN_CHARS) is never treated as redundant —
 * we want to keep short Reddit-style titles visible.
 */
function isTitleRedundantWithBody(title: string, body: string): boolean {
  const headLength = TITLE_OVERLAP_CHECK_CHARS;
  const titleStart = title.slice(0, headLength).trim().toLowerCase();
  const bodyStart = body.slice(0, headLength).trim().toLowerCase();
  if (titleStart.length < TITLE_OVERLAP_MIN_CHARS) return false;
  return titleStart === bodyStart;
}

function pickSourceName(source: PostSourceMetadata | undefined, theme: LinkCardTheme): string {
  // Prefer the admin-set source name (e.g. "r/python") which is the post's
  // specific origin within the platform; fall back to the theme display name
  // ("Hacker News") when the source has no name set.
  if (source?.name) return source.name;
  return theme.displayName;
}

function openCta(theme: LinkCardTheme): string {
  if (theme.id === "generic") return "Open ↗";
  return `Open on ${theme.displayName} ↗`;
}

function containerStyle(theme: LinkCardTheme): React.CSSProperties {
  return {
    display: "flex",
    marginTop: 8,
    marginLeft: 5,
    border: "1px solid #e6e6ea",
    borderRadius: 10,
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    background: theme.background,
  };
}

function accentStripeStyle(theme: LinkCardTheme): React.CSSProperties {
  return {
    width: ACCENT_STRIPE_WIDTH,
    background: theme.accentColor,
    flexShrink: 0,
  };
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  maxHeight: 240,
  objectFit: "cover",
  display: "block",
};

const imageContainerStyle: React.CSSProperties = {
  position: "relative",
  // Lets the absolutely-positioned play overlay center against the image.
};

const playOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "rgba(0, 0, 0, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  // Subtle outline so the button reads on light AND dark images.
  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.3)",
};

const bodyStyle: React.CSSProperties = {
  padding: "10px 14px 12px",
};

function attributionStyle(theme: LinkCardTheme): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    color: theme.accentColor,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  };
}

function badgeStyle(theme: LinkCardTheme): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 4,
    background: theme.badgeBackground,
    color: theme.badgeForeground,
    fontSize: 10,
    fontWeight: 700,
    flexShrink: 0,
  };
}

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  margin: 0,
  marginBottom: 8,
  color: "#1f1f24",
  lineHeight: 1.35,
  letterSpacing: -0.1,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#4a4a52",
  margin: 0,
  marginBottom: 10,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 11,
  color: "#888",
};

const hostnameStyle: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flexShrink: 1,
  minWidth: 0,
};

function ctaStyle(theme: LinkCardTheme): React.CSSProperties {
  return {
    color: theme.accentColor,
    fontWeight: 600,
    flexShrink: 0,
    marginLeft: 8,
  };
}

/**
 * Themed link card. Visual hierarchy:
 *   1. Brand-coloured accent stripe down the left edge
 *   2. Optional hero image
 *   3. Source attribution chip (small, accent-colored, ALL CAPS)
 *   4. Title (the main reading element)
 *   5. Footer row: hostname (subdued, left) · CTA (accent, right)
 *
 * The card border stays a neutral gray; only the stripe + chip + CTA carry
 * brand color so the card doesn't shout. Hacker News keeps its iconic cream
 * background as the only per-theme background variant.
 */
export default function LinkCard({ linkCard, source, bodyText }: Props) {
  if (!linkCard?.url) return null;

  const theme = getLinkCardTheme(source, linkCard);
  const badge = getBadgeLetter(theme, linkCard, source);
  const sourceName = pickSourceName(source, theme);

  const title = linkCard.title?.trim();
  const image = linkCard.image?.trim();
  const hostname = linkCard.hostname?.trim();
  const description = bodyText?.trim();

  return (
    <a
      href={linkCard.url}
      target="_blank"
      rel="noopener noreferrer"
      style={containerStyle(theme)}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={accentStripeStyle(theme)} aria-hidden />
      <div style={contentStyle}>
        {image && (
          <div style={imageContainerStyle}>
            <img
              src={proxyIfNeeded(image)}
              alt={title || hostname || "Link preview"}
              crossOrigin="anonymous"
              style={imageStyle}
            />
            {linkCard.is_video && <PlayButtonOverlay />}
          </div>
        )}
        <div style={bodyStyle}>
          {sourceName && (
            <div style={attributionStyle(theme)}>
              <span style={badgeStyle(theme)} aria-hidden>{badge}</span>
              <span>{sourceName}</span>
            </div>
          )}
          {title && !(description && isTitleRedundantWithBody(title, description)) && (
            <p style={titleStyle}>{truncateTitle(title)}</p>
          )}
          {description && <p style={descriptionStyle}>{description}</p>}
          <div style={footerStyle}>
            <span style={hostnameStyle}>{hostname || ""}</span>
            <span style={ctaStyle(theme)}>{openCta(theme)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

/**
 * Centered semi-transparent play button rendered over a video thumbnail.
 * Pure-SVG triangle so it scales cleanly and ships zero raster assets.
 */
function PlayButtonOverlay() {
  return (
    <div style={playOverlayStyle} aria-label="Video">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <polygon points="7,4 7,18 18,11" fill="#ffffff" />
      </svg>
    </div>
  );
}
