/** Shared color palette for the Widget Store pages. Extracted so the palette
    is defined in one place rather than duplicated at the top of every widget
    page as inline `const bg = ...` lines. */

export const WIDGET_THEME = {
  bg: "#0a0a0f",
  card: "#13131a",
  border: "#23232f",
  accent: "#6c5ce7",
  textPrimary: "#e0e0e0",
  textSecondary: "#888",
} as const;
