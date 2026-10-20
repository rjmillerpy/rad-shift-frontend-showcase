"use client";
import React from "react";
import { RESIZE_HANDLE_PX } from "./constants";

type Props = {
  rowIndex: number;
  onResizeStart: (rowIndex: number, e: React.MouseEvent) => void;
};

/** A thin, full-width invisible strip pinned to the bottom of a row. Grabbing
    it anywhere along the row's bottom edge starts a row-resize drag — the
    real Excel behavior (you don't need to aim at the left row-number bar). */
export default function RowResizeOverlay({ rowIndex, onResizeStart }: Props) {
  return (
    <div
      data-testid={`ledger-row-resize-${rowIndex}`}
      onMouseDown={(e) => onResizeStart(rowIndex, e)}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -Math.floor(RESIZE_HANDLE_PX / 2),
        height: RESIZE_HANDLE_PX,
        cursor: "row-resize",
        zIndex: 3,
      }}
    />
  );
}
