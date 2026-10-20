"use client";
import React from "react";
import type { SheetKey } from "./types";
import { EXCEL, FONT_FAMILY, SHEETS } from "./constants";

const TAB_HEIGHT_PX = 28;
const TAB_H_PADDING_PX = 22;
const TAB_GAP_PX = 4;
// Left padding on the tabs strip so the first tab clears the app-wide
// floating profile avatar rendered at the bottom-left of every page.
const TABS_LEFT_PAD_PX = 72;

type Props = {
  active: SheetKey;
  onChange: (next: SheetKey) => void;
};

/** Excel-style sheet tabs at the bottom of the workbook — one per feed. */
export default function SheetTabs({ active, onChange }: Props) {
  return (
    <div
      data-testid="ledger-sheet-tabs"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: TAB_GAP_PX,
        background: EXCEL.statusBarBg,
        borderTop: `1px solid ${EXCEL.gridLine}`,
        height: TAB_HEIGHT_PX + 6,
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        paddingLeft: TABS_LEFT_PAD_PX,
      }}
    >
      {SHEETS.map((sheet) => {
        const isActive = sheet.key === active;
        return (
          <button
            key={sheet.key}
            data-testid={`ledger-sheet-${sheet.key}`}
            onClick={() => onChange(sheet.key)}
            style={{
              height: TAB_HEIGHT_PX,
              padding: `0 ${TAB_H_PADDING_PX}px`,
              border: "none",
              borderTop: isActive ? `2px solid ${EXCEL.green}` : "2px solid transparent",
              borderLeft: `1px solid ${EXCEL.gridLine}`,
              borderRight: `1px solid ${EXCEL.gridLine}`,
              background: isActive ? "#fff" : "transparent",
              color: isActive ? EXCEL.green : EXCEL.subtleText,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              fontFamily: FONT_FAMILY,
              fontSize: 12,
            }}
          >
            {sheet.label}
          </button>
        );
      })}
    </div>
  );
}
