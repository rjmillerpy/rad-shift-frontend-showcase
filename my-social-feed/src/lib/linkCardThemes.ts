// Single source of truth for the visual treatment of scraped-post link cards.
// One theme per recognisable source; resolution prefers explicit `platform`
// (set by the backend's generator adapters) and falls back to hostname matching
// for ``web`` sources whose origin we still want to brand (e.g. Hacker News).

import type { PostLinkCard, PostSourceMetadata } from "@/types/post";

export interface LinkCardTheme {
  id: "reddit" | "pinterest" | "hackernews" | "x" | "generic";
  displayName: string;
  accentColor: string;
  background: string;
  borderColor: string;
  // Letter-mark used as an inline logo so we don't ship raster images.
  badgeText: string;
  badgeBackground: string;
  badgeForeground: string;
}

const REDDIT_THEME: LinkCardTheme = {
  id: "reddit",
  displayName: "Reddit",
  accentColor: "#ff4500",
  background: "#ffffff",
  borderColor: "#ff4500",
  badgeText: "r/",
  badgeBackground: "#ff4500",
  badgeForeground: "#ffffff",
};

const PINTEREST_THEME: LinkCardTheme = {
  id: "pinterest",
  displayName: "Pinterest",
  accentColor: "#e60023",
  background: "#ffffff",
  borderColor: "#e60023",
  badgeText: "P",
  badgeBackground: "#e60023",
  badgeForeground: "#ffffff",
};

const HACKERNEWS_THEME: LinkCardTheme = {
  id: "hackernews",
  displayName: "Hacker News",
  accentColor: "#ff6600",
  background: "#f6f6ef",
  borderColor: "#ff6600",
  badgeText: "Y",
  badgeBackground: "#ff6600",
  badgeForeground: "#ffffff",
};

const X_THEME: LinkCardTheme = {
  id: "x",
  displayName: "X",
  accentColor: "#000000",
  background: "#ffffff",
  borderColor: "#000000",
  badgeText: "𝕏",
  badgeBackground: "#000000",
  badgeForeground: "#ffffff",
};

const GENERIC_THEME: LinkCardTheme = {
  id: "generic",
  displayName: "",
  accentColor: "#666",
  background: "#ffffff",
  borderColor: "#e0e0e0",
  badgeText: "",
  badgeBackground: "#eeeeee",
  badgeForeground: "#555555",
};

const THEMES_BY_PLATFORM: Record<string, LinkCardTheme> = {
  reddit: REDDIT_THEME,
  pinterest: PINTEREST_THEME,
  x: X_THEME,
  // X search results render with the same X branding.
  x_search: X_THEME,
};

const THEMES_BY_HOSTNAME: Record<string, LinkCardTheme> = {
  "news.ycombinator.com": HACKERNEWS_THEME,
  "ycombinator.com": HACKERNEWS_THEME,
  "twitter.com": X_THEME,
  "x.com": X_THEME,
};

/**
 * Pick the visual theme for a scraped post's card. Prefers the explicit
 * platform id (set by the generator adapter) and only falls back to hostname
 * matching when the platform is generic ``web``.
 */
export function getLinkCardTheme(
  source: PostSourceMetadata | undefined,
  linkCard: PostLinkCard | undefined,
): LinkCardTheme {
  const platform = source?.platform;
  if (platform && platform in THEMES_BY_PLATFORM) {
    return THEMES_BY_PLATFORM[platform];
  }
  const hostname = linkCard?.hostname;
  if (hostname && hostname in THEMES_BY_HOSTNAME) {
    return THEMES_BY_HOSTNAME[hostname];
  }
  return GENERIC_THEME;
}

/**
 * Derive the letter shown in the badge. Themed sources have a static mark;
 * generic sources fall back to the first letter of the hostname (or '?').
 */
export function getBadgeLetter(
  theme: LinkCardTheme,
  linkCard: PostLinkCard | undefined,
  source: PostSourceMetadata | undefined,
): string {
  if (theme.badgeText) return theme.badgeText;
  const fallbackSource = linkCard?.hostname || source?.name || "?";
  return (fallbackSource[0] || "?").toUpperCase();
}
