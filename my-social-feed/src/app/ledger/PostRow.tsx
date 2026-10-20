"use client";
import React, { memo } from "react";
import { COLUMN_KEYS, type ColumnKey, type LedgerRow } from "./types";
import { EXCEL, MEDIA_TYPE_ICON, PADDING_COLUMNS } from "./constants";
import { LedgerCell, RowNumberCell } from "./LedgerCells";
import RowResizeOverlay from "./RowResizeOverlay";

type Props = {
  row: LedgerRow;
  rowIndex: number;
  rowNumber: number;
  selected: boolean;
  selectedCol: ColumnKey;
  height: number;
  editingCol: string | null;   // set to the column letter if this row's cell is being edited
  editDraft: string;
  getEdit: (rowIndex: number, col: string) => string | undefined;
  getColWidth: (letter: string) => number;
  onRowResizeStart: (rowIndex: number, e: React.MouseEvent) => void;
  onSelectCell: (rowIndex: number, col: ColumnKey) => void;
  onStartEdit: (rowIndex: number, col: string) => void;
  onChangeEdit: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onContextMenu: (rowIndex: number, clientX: number, clientY: number) => void;
};

/** Default display for a post-row content column. */
function contentForColumn(row: LedgerRow, col: ColumnKey): string {
  if (col === "A") return row.displayName;
  if (col === "B") return row.displayText;
  if (col === "C") return row.displayLikes.toLocaleString();
  if (col === "D") return row.displayReposts.toLocaleString();
  if (col === "E") return MEDIA_TYPE_ICON[row.mediaKind] ?? "?";
  return row.displayWhen; // col === "F"
}

/** Alignment per column — numeric columns right-align like Excel defaults. */
const COLUMN_ALIGN: Record<ColumnKey, React.CSSProperties["textAlign"]> = {
  A: "left",
  B: "left",
  C: "right",
  D: "right",
  E: "center",
  F: "right",
};

function PostRow(props: Props) {
  const {
    row, rowIndex, rowNumber, selected, selectedCol, height,
    editingCol, editDraft, getEdit, getColWidth,
    onRowResizeStart, onSelectCell,
    onStartEdit, onChangeEdit, onCommitEdit, onCancelEdit,
    onContextMenu,
  } = props;

  return (
    <div
      data-testid={`ledger-row-${rowIndex}`}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(rowIndex, e.clientX, e.clientY); }}
      style={{
        display: "flex",
        height,
        background: selected ? EXCEL.selectedRow : rowIndex % 2 === 0 ? EXCEL.rowWhite : EXCEL.rowBand,
        cursor: "default",
        position: "relative",
      }}
    >
      <RowNumberCell rowNumber={rowNumber} height={height} />
      {COLUMN_KEYS.map((col) => {
        const savedEdit = getEdit(rowIndex, col);
        return (
          <LedgerCell
            key={col}
            testId={`ledger-cell-${rowIndex}-${col}`}
            width={getColWidth(col)}
            height={height}
            align={COLUMN_ALIGN[col]}
            outlined={selected && selectedCol === col}
            content={savedEdit ?? contentForColumn(row, col)}
            isEditing={editingCol === col}
            editDraft={editDraft}
            onClick={() => onSelectCell(rowIndex, col)}
            onStartEdit={() => onStartEdit(rowIndex, col)}
            onChangeEdit={onChangeEdit}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
          />
        );
      })}
      {PADDING_COLUMNS.map((col) => (
        <LedgerCell
          key={col}
          testId={`ledger-pad-${rowIndex}-${col}`}
          width={getColWidth(col)}
          height={height}
          content={getEdit(rowIndex, col) ?? ""}
          isEditing={editingCol === col}
          editDraft={editDraft}
          onClick={() => onSelectCell(rowIndex, "A")}
          onStartEdit={() => onStartEdit(rowIndex, col)}
          onChangeEdit={onChangeEdit}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
        />
      ))}
      <RowResizeOverlay rowIndex={rowIndex} onResizeStart={onRowResizeStart} />
    </div>
  );
}

// Memoized because rows are rendered in a .map (rule 68).
export default memo(PostRow);
