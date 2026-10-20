/**
 * Character-creator constants: attribute option lists, placeholder palette,
 * preview-canvas dimensions. Single source of truth (rules 8, 16) — the
 * schema, the picker UI, and the composition renderer all read from here.
 *
 * Attribute *ids* are the on-wire strings and must match the values enforced
 * by the backend Pydantic schema. Placeholder colors are only used until the
 * pixel-art atlas from the sprite manifest replaces them.
 */
import type { AvatarHalf } from "../data/schema";

// ── Genders ────────────────────────────────────────────────────────────────
export const GENDER_IDS = ["boy", "girl"] as const;
export type GenderId = (typeof GENDER_IDS)[number];

// ── Skin tone (placeholder palette; a pixel artist replaces later) ─────────
export const SKIN_TONE_IDS = ["porcelain", "peach", "olive", "copper", "umber"] as const;
export type SkinToneId = (typeof SKIN_TONE_IDS)[number];
export const SKIN_TONE_COLORS: Record<SkinToneId, string> = {
  porcelain: "#f8e0c8",
  peach: "#f5c6a0",
  olive: "#c88d5a",
  copper: "#96603a",
  umber: "#5a3a26",
};

// ── Hairstyle (id maps to both color and drawn shape) ──────────────────────
export const HAIRSTYLE_IDS = ["short", "long", "curly", "buzz", "ponytail"] as const;
export type HairstyleId = (typeof HAIRSTYLE_IDS)[number];
export const HAIRSTYLE_COLORS: Record<HairstyleId, string> = {
  short: "#3a2418",
  long: "#c17a2d",
  curly: "#1c1c1c",
  buzz: "#867258",
  ponytail: "#d4a017",
};

// ── Clothing ──────────────────────────────────────────────────────────────
export const CLOTHING_IDS = ["hoodie", "tee", "dress", "overalls", "jacket"] as const;
export type ClothingId = (typeof CLOTHING_IDS)[number];
export const CLOTHING_COLORS: Record<ClothingId, string> = {
  hoodie: "#3d5a80",
  tee: "#f9c74f",
  dress: "#e76f51",
  overalls: "#2a9d8f",
  jacket: "#6a4c93",
};

// ── Preview canvas geometry ────────────────────────────────────────────────
export const PREVIEW_WIDTH_PX = 160;
export const PREVIEW_HEIGHT_PX = 200;

// ── Human-readable attribute-group labels for the picker UI ────────────────
export const ATTRIBUTE_GROUP_LABELS = {
  gender: "Gender",
  skin_tone: "Skin",
  hairstyle: "Hair",
  clothing: "Clothing",
} as const;

// ── Default starting half — used as the seed for a fresh avatar ───────────
export const DEFAULT_HALF: AvatarHalf = {
  gender: "boy",
  skin_tone: "peach",
  hairstyle: "short",
  clothing: "hoodie",
};
