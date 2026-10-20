"use client";
import React from "react";
import type { CellCoord } from "./types";
import { EXCEL, FONT_FAMILY } from "./constants";

const HEIGHT_PX = 24;
const COORD_WIDTH_PX = 60;

type Props = {
  coord: CellCoord;
  rowNumber: number;
  cellText: string;
};

/** Excel formula bar — Name Box on the left ("A3"), fx separator, then the
    cell's current value. Read-only; typing here doesn't edit anything. */
export default function FormulaBar({ coord, rowNumber, cellText }: Props) {
  const coordLabel = `${coord.col}${rowNumber}`;
  return (
    <div
      data-testid="ledger-formula-bar"
      style={{
        display: "flex",
        alignItems: "center",
        height: HEIGHT_PX,
        background: EXCEL.formulaBarBg,
        borderBottom: `1px solid ${EXCEL.gridLine}`,
        fontFamily: FONT_FAMILY,
        fontSize: 12,
      }}
    >
      <div
        data-testid="ledger-name-box"
        style={{
          width: COORD_WIDTH_PX,
          height: HEIGHT_PX,
          padding: "0 6px",
          borderRight: `1px solid ${EXCEL.gridLine}`,
          display: "flex",
          alignItems: "center",
          color: EXCEL.cellText,
          background: "#fff",
        }}
      >
        {coordLabel}
      </div>
      <div
        style={{
          width: 32,
          textAlign: "center",
          color: EXCEL.subtleText,
          fontStyle: "italic",
          borderRight: `1px solid ${EXCEL.gridLine}`,
        }}
      >
        fx
      </div>
      <div
        data-testid="ledger-formula-content"
        style={{
          flex: 1,
          padding: "0 8px",
          color: EXCEL.cellText,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {cellText}
      </div>
    </div>
  );
}
