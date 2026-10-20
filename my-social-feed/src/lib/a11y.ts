import type { CSSProperties, KeyboardEvent } from "react";

/** Accessibility helpers (SonarQube's interactive-element rules, item 18).

    Prefer a real <button>: focusable, Enter/Space for free, announced as a
    button. UNSTYLED_BUTTON makes one look like the plain element it replaces
    (spread it before the element's own styles, which win).

    buttonProps is for elements that can't be a <button> because they
    contain other buttons (a button inside a button is invalid HTML). */

export const UNSTYLED_BUTTON: CSSProperties = {
  font: "inherit",
  color: "inherit",
  textAlign: "inherit",
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
};

const ACTIVATION_KEYS = new Set(["Enter", " "]);

export function buttonProps(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      // Only keys pressed on this element itself, not ones bubbling up from
      // a button or input inside it.
      if (e.target !== e.currentTarget || !ACTIVATION_KEYS.has(e.key)) return;
      e.preventDefault(); // Space would otherwise scroll the page
      onActivate();
    },
  };
}
