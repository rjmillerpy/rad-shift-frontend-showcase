"use client";
import { useCallback, useRef, useState } from "react";
import { COLUMN_KEYS } from "./types";
import {
  COLUMN_WIDTHS,
  MAX_COL_WIDTH_PX,
  MAX_ROW_HEIGHT_PX,
  MIN_COL_WIDTH_PX,
  MIN_ROW_HEIGHT_PX,
  PADDING_COL_WIDTH_PX,
  ROW_HEIGHT_PX,
} from "./constants";

function isContentCol(letter: string): letter is keyof typeof COLUMN_WIDTHS {
  return (COLUMN_KEYS as readonly string[]).includes(letter);
}

/** Base width for a column before any user resize is applied. */
function baseColWidth(letter: string): number {
  return isContentCol(letter) ? COLUMN_WIDTHS[letter] : PADDING_COL_WIDTH_PX;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Runtime overrides for column widths and row heights so the user can drag
 * borders like Excel. Empty overrides = keep defaults.
 *
 * Uses window mousemove/mouseup listeners registered on drag start and
 * removed on release (rule 71). Refs cache the drag origin so a rapid
 * mousemove sequence sees a stable start point.
 */
export function useGridResize() {
  const [colOverrides, setColOverrides] = useState<Record<string, number>>({});
  const [rowOverrides, setRowOverrides] = useState<Record<number, number>>({});

  const dragRef = useRef<{ cleanup: () => void } | null>(null);

  const getColWidth = useCallback((letter: string): number => {
    const override = colOverrides[letter];
    return override !== undefined ? override : baseColWidth(letter);
  }, [colOverrides]);

  const getRowHeight = useCallback((row: number): number => {
    return rowOverrides[row] ?? ROW_HEIGHT_PX;
  }, [rowOverrides]);

  const startColResize = useCallback((letter: string, e: { clientX: number; preventDefault: () => void }) => {
    e.preventDefault();
    dragRef.current?.cleanup();
    const startX = e.clientX;
    const startWidth = colOverrides[letter] ?? baseColWidth(letter);
    const onMove = (m: MouseEvent) => {
      const next = clamp(startWidth + m.clientX - startX, MIN_COL_WIDTH_PX, MAX_COL_WIDTH_PX);
      setColOverrides((prev) => ({ ...prev, [letter]: next }));
    };
    const onUp = () => cleanup();
    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    dragRef.current = { cleanup };
  }, [colOverrides]);

  const startRowResize = useCallback((row: number, e: { clientY: number; preventDefault: () => void }) => {
    e.preventDefault();
    dragRef.current?.cleanup();
    const startY = e.clientY;
    const startHeight = rowOverrides[row] ?? ROW_HEIGHT_PX;
    const onMove = (m: MouseEvent) => {
      const next = clamp(startHeight + m.clientY - startY, MIN_ROW_HEIGHT_PX, MAX_ROW_HEIGHT_PX);
      setRowOverrides((prev) => ({ ...prev, [row]: next }));
    };
    const onUp = () => cleanup();
    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    dragRef.current = { cleanup };
  }, [rowOverrides]);

  return { getColWidth, getRowHeight, startColResize, startRowResize };
}
