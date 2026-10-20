"use client";
import React from "react";

// One shared style for every icon-button in the post actions row. Keeping
// this in one place is rule 16 — one source of truth.
const ICON_BTN_STYLE: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

type Props = {
  iconSrc: string;
  iconAlt: string;
  iconSize: number;
  title: string;
  onClick: () => void;
  filter?: string;
  transitionMs?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  /** For the share button, which uses an ID hook rather than filter styling. */
  buttonId?: string;
  buttonClassName?: string;
};

/**
 * One toolbar icon-button used by PostActions. Applies a CSS filter to the
 * inner <img> so each action gets its own hover/active tint without every
 * caller repeating the transition + border-radius boilerplate.
 */
export default function IconActionButton({
  iconSrc, iconAlt, iconSize, title, onClick,
  filter, transitionMs = 200,
  onMouseEnter, onMouseLeave, onMouseDown, onMouseUp,
  buttonId, buttonClassName,
}: Props) {
  return (
    <button id={buttonId} className={buttonClassName} onClick={onClick} title={title} style={ICON_BTN_STYLE}>
      <img
        src={iconSrc}
        alt={iconAlt}
        height={iconSize}
        width={iconSize}
        style={{
          borderRadius: "8px",
          objectFit: "cover",
          transition: `filter ${transitionMs / 1000}s ease-in-out`,
          filter: filter ?? "none",
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      />
    </button>
  );
}
