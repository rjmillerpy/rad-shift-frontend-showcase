// Shared constants for the blog editor.

/** Overused AI-writing phrases. Publish is blocked if any of these are found
    in the post body. Draft-save is still allowed so authors can fix the copy. */
export const AI_BANNED = [
  "delve", "utilize", "leverage", "pivotal", "groundbreaking", "game-changer",
  "in a world where", "it's worth noting", "at the end of the day",
  "when all is said and done", "needless to say", "navigate the complexities",
  "harness the power", "paradigm shift", "synergy", "holistic approach",
  "unlock the potential", "robust", "seamless", "streamline", "empower",
] as const;

export const OPTIMAL_TIMES = [
  { day: "Tuesday", time: "10:00 AM", reason: "Highest engagement" },
  { day: "Thursday", time: "2:00 PM", reason: "Strong afternoon traffic" },
  { day: "Wednesday", time: "11:00 AM", reason: "Mid-week peak" },
] as const;

export type ToolbarButton = {
  label: string;
  cmd: string;
  icon: string;
  style: React.CSSProperties;
};

export const TOOLBAR: ToolbarButton[] = [
  { label: "Bold", cmd: "strong", icon: "B", style: { fontWeight: "bold" } },
  { label: "Italic", cmd: "em", icon: "I", style: { fontStyle: "italic" } },
  { label: "Heading 2", cmd: "h2", icon: "H2", style: {} },
  { label: "Heading 3", cmd: "h3", icon: "H3", style: {} },
  { label: "Blockquote", cmd: "blockquote", icon: "❝", style: {} },
  { label: "Bullet List", cmd: "ul", icon: "•", style: {} },
  { label: "Code Block", cmd: "code", icon: "</>", style: { fontFamily: "monospace" } },
  { label: "Link", cmd: "a", icon: "🔗", style: {} },
  { label: "Image", cmd: "img", icon: "🖼", style: {} },
  { label: "Horizontal Rule", cmd: "hr", icon: "—", style: {} },
];

// Character caps shown in the SEO panel meta counters.
export const SEO_TITLE_MAX_CHARS = 60;
export const SEO_DESCRIPTION_MAX_CHARS = 160;
export const OG_TITLE_MAX_CHARS = 70;
export const OG_DESCRIPTION_MAX_CHARS = 200;

// Average adult reading speed (words per minute) used to compute "N min read".
export const WORDS_PER_MINUTE = 200;
