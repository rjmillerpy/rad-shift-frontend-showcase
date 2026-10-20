"use client";
import React, { useMemo } from "react";
import { COLUMN_KEYS } from "./types";
import { PADDING_COLUMNS, RESIZE_HANDLE_PX, ROW_NUMBER_COL_WIDTH_PX } from "./constants";

type Props = {
  getColWidth: (letter: string) => number;
  onColResizeStart: (letter: string, e: React.MouseEvent) => void;
};

type Strip = { letter: string; rightEdgePx: number };

/** Compute the running x-position of every column's right edge given the
    current column widths. Pure — memoized in the component below. */
export function computeStripPositions(getColWidth: (letter: string) => number): Strip[] {
  const strips: Strip[] = [];
  let x = ROW_NUMBER_COL_WIDTH_PX;
  for (const letter of COLUMN_KEYS) {
    x += getColWidth(letter);
    strips.push({ letter, rightEdgePx: x });
  }
  for (const letter of PADDING_COLUMNS) {
    x += getColWidth(letter);
    strips.push({ letter, rightEdgePx: x });
  }
  return strips;
}

/** A vertical drag strip at every column's right edge, layered on top of the
    grid. Grabbing any strip resizes that column — you don't have to reach the
    header row. Rendered once at page level as a sibling to the grid rows. */
export default function ColumnResizeOverlays({ getColWidth, onColResizeStart }: Props) {
  const strips = useMemo(() => computeStripPositions(getColWidth), [getColWidth]);
  const halfHandle = Math.floor(RESIZE_HANDLE_PX / 2);
  return (
    <>
      {strips.map(({ letter, rightEdgePx }) => (
        <div
          key={letter}
          data-testid={`ledger-col-resize-${letter}`}
          onMouseDown={(e) => onColResizeStart(letter, e)}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: rightEdgePx - halfHandle,
            width: RESIZE_HANDLE_PX,
            cursor: "col-resize",
            zIndex: 4,
          }}
        />
      ))}
    </>
  );
}
