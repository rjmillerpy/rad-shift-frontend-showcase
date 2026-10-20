import type { Post } from "@/types/post";

export type TopicDef = {
  label: string;
  color: string;
  isFeed?: boolean;
  tab?: string;
};

export type Bubble = {
  label: string;
  color: string;
  isFeed: boolean;
  tab?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

// Discriminated union for items in a zoomed constellation orbit.
// Each type maps to a distinct visual (back button, main-hub balloon,
// paginate control, category chip, "micro" tag chip, or a post bubble).
export type OrbitItem =
  | { type: "back"; label: string }
  | { type: "balloon"; label: string }
  | { type: "paginate"; label: string }
  | { type: "subcategory"; label: string; tag: string }
  | { type: "micro"; label: string; tag: string }
  | { type: "post"; label: string; post: Post };

// One step in the drill-down navigation history — either a topic focus or
// a post focus (or both null for the overview).
export type NavHistoryEntry = {
  topic: TopicDef | null;
  post: Post | null;
};

export type BubbleSettings = {
  custom_topics: string[];
  hidden_topics: string[];
};

// Viewport dimensions kept as a single object so components can accept `{w, h}`
// rather than two loose props.
export type ViewportSize = {
  w: number;
  h: number;
};

// State returned by the profile bubble drifter — a circle with position + velocity.
export type ProfileBubbleState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};
