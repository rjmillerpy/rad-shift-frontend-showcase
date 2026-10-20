import type { Post } from "@/types/post";

// A single unit of narrative content produced by the LLM chronicler.
// Either prose text between posts, an inline post reference, or a media call-out.
export type Segment =
  | { type: "narrative"; text: string }
  | { type: "post"; index: number }
  | { type: "media"; index: number };

export type ChapterData = {
  segments: Segment[];
  posts: Post[];
  page: number;
  has_more: boolean;
  cached: boolean;
};

// Posts per streaming vs non-streaming request. The streaming path uses fewer
// posts per page so the LLM can produce a chapter faster.
export const POSTS_PER_PAGE_STREAM = 8;
export const POSTS_PER_PAGE_FALLBACK = 12;

// Fallback request timeout when SSE fails and we retry via api.get. Long-running
// LLM generation on local hardware can take several minutes; 10 min is the
// pragmatic upper bound we're willing to wait before giving up.
export const FALLBACK_TIMEOUT_MS = 600_000;

// SessionStorage key for the user's chosen story title.
export const CHRONICLE_TITLE_KEY = "chronicle_title";
export const DEFAULT_UNTITLED = "An Untitled Chronicle";
