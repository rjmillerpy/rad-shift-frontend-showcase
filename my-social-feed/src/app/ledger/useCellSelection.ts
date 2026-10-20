"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CellCoord, ColumnKey } from "./types";
import { COLUMN_KEYS } from "./types";
import { SEARCH_FOCUS_KEY } from "./constants";

/** Positional (row, col) matches how PostRow forwards clicks — one Excel cell
    click passes both coords, so it's clearer than a coord object. */

type Options = {
  rowCount: number;
  onOpenRow: (rowIndex: number) => void;
  onFocusSearch: () => void;
};

const DEFAULT_COL: ColumnKey = "A";

function clampRow(next: number, total: number): number {
  if (total === 0) return 0;
  if (next < 0) return 0;
  if (next >= total) return total - 1;
  return next;
}

function nextCol(current: ColumnKey, delta: 1 | -1): ColumnKey {
  const idx = COLUMN_KEYS.indexOf(current);
  const bounded = Math.max(0, Math.min(COLUMN_KEYS.length - 1, idx + delta));
  return COLUMN_KEYS[bounded];
}

/**
 * Excel-style keyboard navigation for the grid: arrow keys move the selected
 * cell, Enter opens the current row, and `/` focuses the search box.
 *
 * The listener is registered on `window` so navigation works even when the
 * grid doesn't have DOM focus (a real Excel would use a hidden text input
 * to catch keys; window-level is simpler and equivalent for our use).
 */
export function useCellSelection({ rowCount, onOpenRow, onFocusSearch }: Options) {
  const [selection, setSelection] = useState<CellCoord>({ row: 0, col: DEFAULT_COL });

  // Mirror selection into a ref so the window-level keydown listener can
  // read the latest value without re-registering on every state change.
  // The ref is synced inside each state updater rather than in a post-render
  // effect so multiple keys dispatched in the same tick see the latest value
  // (e.g. ArrowDown → ArrowDown → Enter within one act()).
  const selectionRef = useRef(selection);
  const setSelectionAndRef = useCallback((updater: (prev: CellCoord) => CellCoord) => {
    setSelection((prev) => {
      const next = updater(prev);
      selectionRef.current = next;
      return next;
    });
  }, []);

  const selectCell = useCallback((row: number, col: ColumnKey) => {
    setSelectionAndRef(() => ({ row: clampRow(row, rowCount), col }));
  }, [rowCount, setSelectionAndRef]);

  useEffect(() => {
    setSelectionAndRef((prev) => ({ ...prev, row: clampRow(prev.row, rowCount) }));
  }, [rowCount, setSelectionAndRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === SEARCH_FOCUS_KEY) { e.preventDefault(); onFocusSearch(); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); setSelectionAndRef((prev) => ({ ...prev, row: clampRow(prev.row + 1, rowCount) })); return; }
      if (e.key === "ArrowUp")    { e.preventDefault(); setSelectionAndRef((prev) => ({ ...prev, row: clampRow(prev.row - 1, rowCount) })); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); setSelectionAndRef((prev) => ({ ...prev, col: nextCol(prev.col, 1) })); return; }
      if (e.key === "ArrowLeft")  { e.preventDefault(); setSelectionAndRef((prev) => ({ ...prev, col: nextCol(prev.col, -1) })); return; }
      if (e.key === "Enter")      { e.preventDefault(); onOpenRow(selectionRef.current.row); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rowCount, onOpenRow, onFocusSearch, setSelectionAndRef]);

  return { selection, selectCell };
}
