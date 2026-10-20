// Shared constants for the Bubbles feed page.
// All magic numbers, palettes, and timing values live here so tuning any single
// value is a one-file edit rather than a grep hunt.

// ── Topic definitions ────────────────────────────────────────────────────────

export const FEED_TOPICS = [
  { label: "Algo", color: "#007bff", isFeed: true, tab: "algo" },
  { label: "Following", color: "#6f42c1", isFeed: true, tab: "following" },
] as const;

export const GENERAL_TOPICS = [
  { label: "Technology", color: "#e74c3c" },
  { label: "Science", color: "#3498db" },
  { label: "Music", color: "#e67e22" },
  { label: "Art", color: "#9b59b6" },
  { label: "Gaming", color: "#2ecc71" },
  { label: "Sports", color: "#f39c12" },
  { label: "Politics", color: "#1abc9c" },
  { label: "Film", color: "#e84393" },
  { label: "Food", color: "#fd79a8" },
  { label: "Travel", color: "#00cec9" },
  { label: "Books", color: "#6c5ce7" },
  { label: "Fitness", color: "#d63031" },
  { label: "Finance", color: "#0984e3" },
  { label: "Nature", color: "#00b894" },
  { label: "Fashion", color: "#a29bfe" },
  { label: "Humor", color: "#fdcb6e" },
  { label: "Photography", color: "#636e72" },
  { label: "Education", color: "#74b9ff" },
];

// Palette used to color user-defined custom topics; cycles by index.
export const CUSTOM_TOPIC_COLORS = [
  "#e91e63", "#ff5722", "#795548", "#607d8b",
  "#009688", "#4caf50", "#ff9800",
];

// Micro-category chips shown as small dashed bubbles inside a topic constellation.
export const MICRO_KEYWORDS: Record<string, string[]> = {
  technology: ["AI", "Web Dev", "Cloud", "Security", "Open Source", "Mobile", "DevOps", "Databases"],
  science: ["Physics", "Biology", "Chemistry", "Space", "Genetics", "Climate", "Neuroscience"],
  music: ["Jazz", "Rock", "Hip Hop", "Classical", "Electronic", "Indie", "Production"],
  art: ["Painting", "Sculpture", "Digital", "Photography", "Street Art", "Typography"],
  gaming: ["Indie", "RPG", "FPS", "Puzzle", "VR", "Esports", "Retro", "Modding"],
  sports: ["Basketball", "Soccer", "Tennis", "Swimming", "Running", "Climbing"],
  politics: ["Policy", "Elections", "Diplomacy", "Local Gov", "Reform"],
  film: ["Horror", "Sci-Fi", "Documentary", "Animation", "Indie Film", "Cinematography"],
  food: ["Baking", "Fermentation", "Street Food", "Recipes", "Nutrition", "Restaurants"],
  travel: ["Backpacking", "Road Trips", "Budget", "Culture", "Adventure", "Solo Travel"],
  books: ["Fiction", "Non-Fiction", "Poetry", "Sci-Fi Lit", "Biography", "Graphic Novels"],
  fitness: ["Strength", "Cardio", "Yoga", "Recovery", "Nutrition", "Calisthenics"],
  finance: ["Investing", "Budgeting", "Crypto", "Real Estate", "Taxes", "Retirement"],
  nature: ["Wildlife", "Forests", "Ocean", "Astronomy", "Gardening", "Conservation"],
  fashion: ["Sustainable", "Vintage", "Streetwear", "Tailoring", "Sneakers"],
  humor: ["Dad Jokes", "Memes", "Satire", "Standup", "Observational"],
  photography: ["Landscape", "Portrait", "Street", "Macro", "Astrophotography"],
  education: ["Online Learning", "STEM", "Languages", "Teaching", "EdTech"],
};

// ── Timing & sizing ──────────────────────────────────────────────────────────

// Minimum gap between drill-in actions to prevent rage-clicking through levels.
export const COOLDOWN_MS = 2000;

// Diameter of the floating profile avatar in overview mode.
export const PROFILE_BUBBLE_SIZE = 80;

// Posts fetched per topic page.
export const POST_PAGE_SIZE = 15;

// Delay between fade transitions when navigating between zoom states.
export const NAV_TRANSITION_MS = 300;

// Interval for auto-rotating multi-image carousels inside orbit bubbles.
export const CAROUSEL_ROTATE_MS = 3000;

// A post the user has hovered longer than this counts as "deeply read" and
// gets a gold-ring highlight next time it appears in a constellation.
export const DEEP_READ_HOVER_MS = 10_000;

// Fixed random seed for `allTopics` bubble layout so positions are deterministic
// on the same viewport (rearranging every render would be visually jarring).
export const BUBBLE_SEED = 42;

// Reference viewport short-side used to scale the constellation geometry.
export const VIEW_SCALE_REF_PX = 800;

// ── Style tokens ─────────────────────────────────────────────────────────────

// Hexagonal clip-path used for the user avatar. Reused in every place a
// hex-shaped avatar is rendered on this page.
export const HEX_AVATAR_CLIP = "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)";
