// SVG-filter tints used by the post action toolbar buttons. Each pair
// (hover, active) makes the button color match its meaning: red for like,
// green for repost, brown for slop, deep red for report.
//
// Kept in one file so a designer tuning any hue only edits here (rule 16).

export const LIKE_ACTIVE =
  "brightness(0.85) saturate(100%) sepia(100%) hue-rotate(-50deg) saturate(600%) contrast(1.2)";
export const LIKE_HOVER =
  "brightness(0.95) sepia(1) hue-rotate(-50deg) saturate(300%) contrast(1.1)";

export const REPOST_ACTIVE_OR_HOVER =
  "brightness(0.95) sepia(1) hue-rotate(120deg) saturate(300%) contrast(1.1)";

export const SAVE_ACTIVE =
  "brightness(0.9) sepia(1) hue-rotate(200deg) saturate(400%) contrast(1.1)";
export const SAVE_HOVER =
  "brightness(0.95) sepia(1) hue-rotate(200deg) saturate(300%) contrast(1.1)";

export const TAG_ACTIVE =
  "brightness(1.1) sepia(1) hue-rotate(60deg) saturate(700%) contrast(1.4)";
export const TAG_HOVER =
  "brightness(1.05) sepia(1) hue-rotate(60deg) saturate(300%) contrast(1.2)";

export const BROWN_HOVER =
  "sepia(1) saturate(550%) hue-rotate(15deg) brightness(0.85) contrast(1.05)";
export const BROWN_ACTIVE =
  "sepia(1) saturate(650%) hue-rotate(15deg) brightness(0.78) contrast(1.12)";

export const RED_HOVER =
  "sepia(1) saturate(600%) hue-rotate(-20deg) brightness(0.8) contrast(1.1)";
export const RED_ACTIVE =
  "sepia(1) saturate(700%) hue-rotate(-20deg) brightness(0.7) contrast(1.15)";

// Laugh emoji uses filter saturation directly (no image tint).
export const LAUGH_ACTIVE_FILTER = "saturate(200%) brightness(1.1)";
export const LAUGH_HOVER_FILTER = "saturate(150%) brightness(1.05)";
export const LAUGH_IDLE_FILTER = "saturate(50%) brightness(0.8)";

// Default icon size for the full/compact variants.
export const ICON_SIZE_FULL = 75;
export const ICON_SIZE_COMPACT = 28;
export const COUNT_FONT_FULL = 14;
export const COUNT_FONT_COMPACT = 11;
