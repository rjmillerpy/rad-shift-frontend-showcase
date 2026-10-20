"use client";
import React, { memo } from "react";

const SWATCH_SIZE_PX = 40;
const ACTIVE_BORDER_COLOR = "#217346";
const IDLE_BORDER_COLOR = "#d0d7de";

type Props = {
  id: string;
  color: string;
  selected: boolean;
  onSelect: (id: string) => void;
  label?: string;
};

/** Small colored tile used by the picker. Memoized (rule 68) because pickers
    render a list of these and their props are stable per render. */
function AttributeSwatch({ id, color, selected, onSelect, label }: Props) {
  return (
    <button
      type="button"
      data-testid={`amble-swatch-${id}`}
      aria-label={label ?? id}
      aria-pressed={selected}
      onClick={() => onSelect(id)}
      style={{
        width: SWATCH_SIZE_PX,
        height: SWATCH_SIZE_PX,
        background: color,
        border: `2px solid ${selected ? ACTIVE_BORDER_COLOR : IDLE_BORDER_COLOR}`,
        borderRadius: 4,
        padding: 0,
        cursor: "pointer",
        outline: "none",
      }}
    />
  );
}

export default memo(AttributeSwatch);
