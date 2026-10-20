"use client";
import { useCallback, useEffect, useState } from "react";
import type { ColumnKey, LedgerRow } from "./types";
import { sanitize } from "./sfwFilter";

/** Return the SFW untruncated content for a given cell — this is what shows
    in the formula bar (Excel shows the full value there, not the truncated
    cell display) and what pre-fills the edit input on first double-click. */
export function cellRawValue(row: LedgerRow | undefined, col: ColumnKey): string {
  if (!row) return "";
  if (col === "A") return row.rawName;
  if (col === "B") return row.rawText;
  if (col === "C") return String(row.displayLikes);
  if (col === "D") return String(row.displayReposts);
  if (col === "E") return row.mediaKind;
  return row.displayWhen;
}

const CONTENT_COLS = new Set<string>(["A", "B", "C", "D", "E", "F"]);

type EditCoord = { row: number; col: string };

/**
 * Owns the client-side edit overlay for the ledger grid. Edits never mutate
 * the underlying post — they're purely a visual overlay so the sheet feels
 * like a real Excel workbook. The overlay is cleared whenever `resetKey`
 * changes (page uses this to wipe edits on sheet switch).
 */
export function useLedgerEditing({
  rows,
  resetKey,
}: {
  rows: LedgerRow[];
  resetKey: string;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<EditCoord | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    setEdits({});
    setEditing(null);
    setEditDraft("");
  }, [resetKey]);

  const getEdit = useCallback(
    (rowIndex: number, col: string): string | undefined => edits[`${rowIndex}-${col}`],
    [edits],
  );

  const startEdit = useCallback((rowIndex: number, col: string) => {
    const saved = edits[`${rowIndex}-${col}`];
    if (saved !== undefined) {
      setEditDraft(saved);
    } else if (CONTENT_COLS.has(col)) {
      setEditDraft(cellRawValue(rows[rowIndex], col as ColumnKey));
    } else {
      setEditDraft("");
    }
    setEditing({ row: rowIndex, col });
  }, [edits, rows]);

  const commitEdit = useCallback(() => {
    if (!editing) return;
    // Sanitize on commit so anything the user typed is stored SFW.
    const clean = sanitize(editDraft);
    // Two plain updates, not setEdits inside setEditing's updater: updaters
    // must be pure, and React may call one twice (StrictMode, concurrent renders).
    setEdits((prev) => ({ ...prev, [`${editing.row}-${editing.col}`]: clean }));
    setEditing(null);
  }, [editDraft, editing]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setEditDraft("");
  }, []);

  return {
    editing,
    editDraft,
    setEditDraft,
    getEdit,
    startEdit,
    commitEdit,
    cancelEdit,
  };
}
