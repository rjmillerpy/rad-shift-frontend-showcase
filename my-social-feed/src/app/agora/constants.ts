/** Shared constants for the Agora forum feed and thread pages. */

export const AGORA_TABS = [
  { key: "algo", label: "Algo" },
  { key: "following", label: "Following" },
] as const;

export type AgoraTabKey = (typeof AGORA_TABS)[number]["key"];

export const POSTS_PER_PAGE = 20;

// Character caps for text truncation. Kept named so we can tweak in one place
// and keep the list page and thread breadcrumb visually consistent.
export const LIST_ROW_PREVIEW_CHARS = 80;
export const THREAD_TITLE_PREVIEW_CHARS = 100;
export const BREADCRUMB_PREVIEW_CHARS = 50;

// Reaction button config used by the thread page's per-post footer.
export const REACTION_ACTIONS = [
  { action: "like", emoji: "❤️" },
  { action: "laugh", emoji: "😂" },
  { action: "repost", emoji: "🔁" },
  { action: "save", emoji: "💾" },
] as const;

export type ReactionAction = (typeof REACTION_ACTIONS)[number]["action"];
