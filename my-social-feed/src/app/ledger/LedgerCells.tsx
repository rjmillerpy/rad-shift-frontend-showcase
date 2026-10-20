"use client";
import React from "react";
import { EXCEL, FONT_FAMILY, ROW_NUMBER_COL_WIDTH_PX } from "./constants";
import EditableCell from "./EditableCell";

/** The building blocks every ledger row is made of: the grey row-number cell
    and the editable data cell. PostRow (a post) and EmptyRow (the blank rows
    below the data) differ only in what they put in the cells. */

const GRID_BORDER = `1px solid ${EXCEL.gridLine}`;

// Numeric columns right-align, like a spreadsheet; anything else starts left.
const JUSTIFY: Partial<Record<NonNullable<React.CSSProperties["textAlign"]>, React.CSSProperties["justifyContent"]>> = {
  right: "flex-end",
  center: "center",
};

export function RowNumberCell({ rowNumber, height }: Readonly<{ rowNumber: number; height: number }>) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        flexShrink: 0,
        width: ROW_NUMBER_COL_WIDTH_PX,
        height,
        background: EXCEL.header,
        borderRight: GRID_BORDER,
        borderBottom: GRID_BORDER,
        fontFamily: FONT_FAMILY,
        fontSize: 11,
        color: EXCEL.headerText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {rowNumber}
    </div>
  );
}

type CellProps = {
  testId: string;
  width: number;
  height: number;
  /** What the cell shows when it isn't being edited. */
  content: React.ReactNode;
  isEditing: boolean;
  editDraft: string;
  align?: React.CSSProperties["textAlign"];
  outlined?: boolean;
  onClick?: () => void;
  onStartEdit: () => void;
  onChangeEdit: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
};

export function LedgerCell({
  testId, width, height, content, isEditing, editDraft, align = "left", outlined = false,
  onClick, onStartEdit, onChangeEdit, onCommitEdit, onCancelEdit,
}: Readonly<CellProps>) {
  return (
    <div
      data-testid={testId}
      onClick={onClick}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
      style={{
        boxSizing: "border-box",
        flexShrink: 0,
        width,
        height,
        borderRight: GRID_BORDER,
        borderBottom: GRID_BORDER,
        outline: outlined ? `2px solid ${EXCEL.selectedBorder}` : "none",
        outlineOffset: outlined ? -2 : 0,
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        color: EXCEL.cellText,
        padding: "0 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: (align && JUSTIFY[align]) ?? "flex-start",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {isEditing ? (
        <EditableCell
          value={editDraft}
          align={align}
          onChange={onChangeEdit}
          onCommit={onCommitEdit}
          onCancel={onCancelEdit}
        />
      ) : content}
    </div>
  );
}
