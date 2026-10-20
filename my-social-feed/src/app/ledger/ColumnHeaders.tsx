"use client";
import React from "react";
import { COLUMN_KEYS } from "./types";
import {
  COLUMN_LABELS,
  EXCEL,
  FONT_FAMILY,
  HEADER_ROW_HEIGHT_PX,
  PADDING_COLUMNS,
  ROW_NUMBER_COL_WIDTH_PX,
} from "./constants";

type Props = {
  getColWidth: (letter: string) => number;
};

/** Sticky column-letter header (A–F plus padding letters). Column resize is
    handled by ColumnResizeOverlays, which layers full-height drag strips over
    the entire grid — the user can grab a column border in the header row or
    any cell below it. */
export default function ColumnHeaders({ getColWidth }: Props) {
  const cellStyle: React.CSSProperties = {
    boxSizing: "border-box",
    flexShrink: 0,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: 600,
    height: HEADER_ROW_HEIGHT_PX,
    background: EXCEL.header,
    color: EXCEL.headerText,
    borderRight: `1px solid ${EXCEL.gridLine}`,
    borderBottom: `1px solid ${EXCEL.gridLine}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  };

  return (
    <div
      data-testid="ledger-column-headers"
      style={{
        display: "flex",
        position: "sticky",
        top: 0,
        zIndex: 2,
      }}
    >
      <div style={{ ...cellStyle, width: ROW_NUMBER_COL_WIDTH_PX }}>{""}</div>
      {COLUMN_KEYS.map((c) => (
        <div key={c} style={{ ...cellStyle, width: getColWidth(c) }} title={COLUMN_LABELS[c]}>
          {c}
        </div>
      ))}
      {PADDING_COLUMNS.map((c) => (
        <div
          key={c}
          data-testid={`ledger-header-pad-${c}`}
          style={{ ...cellStyle, width: getColWidth(c) }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}
