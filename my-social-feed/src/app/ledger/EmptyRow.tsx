"use client";
import React, { memo } from "react";
import { COLUMN_KEYS } from "./types";
import { EXCEL, PADDING_COLUMNS } from "./constants";
import { LedgerCell, RowNumberCell } from "./LedgerCells";
import RowResizeOverlay from "./RowResizeOverlay";

type Props = {
  rowIndex: number;
  rowNumber: number;
  height: number;
  editingCol: string | null;
  editDraft: string;
  getEdit: (rowIndex: number, col: string) => string | undefined;
  getColWidth: (letter: string) => number;
  onRowResizeStart: (rowIndex: number, e: React.MouseEvent) => void;
  onStartEdit: (rowIndex: number, col: string) => void;
  onChangeEdit: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
};

/** A blank row rendered below the last post — mimics how a workbook continues
    into empty rows past the data. Cells are still editable so the user can
    scribble anywhere in the sheet. */
function EmptyRow(props: Props) {
  const {
    rowIndex, rowNumber, height, editingCol, editDraft,
    getEdit, getColWidth, onRowResizeStart,
    onStartEdit, onChangeEdit, onCommitEdit, onCancelEdit,
  } = props;

  return (
    <div
      data-testid={`ledger-empty-row-${rowIndex}`}
      style={{
        display: "flex",
        height,
        background: rowIndex % 2 === 0 ? EXCEL.rowWhite : EXCEL.rowBand,
        position: "relative",
      }}
    >
      <RowNumberCell rowNumber={rowNumber} height={height} />
      {[...COLUMN_KEYS, ...PADDING_COLUMNS].map((col) => (
        <LedgerCell
          key={col}
          testId={`ledger-empty-cell-${rowIndex}-${col}`}
          width={getColWidth(col)}
          height={height}
          content={getEdit(rowIndex, col) ?? ""}
          isEditing={editingCol === col}
          editDraft={editDraft}
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

export default memo(EmptyRow);
