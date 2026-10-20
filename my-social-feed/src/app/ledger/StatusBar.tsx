"use client";
import React from "react";
import {
  EXCEL,
  FONT_FAMILY,
  ZOOM_MAX_PCT,
  ZOOM_MIN_PCT,
  ZOOM_STEP_PCT,
} from "./constants";

const HEIGHT_PX = 22;

type Props = {
  loading: boolean;
  rowCount: number;
  selectedRowNumber: number;
  totalLikes: number;
  zoomPct: number;
  onZoomChange: (v: number) => void;
};

/** Bottom status bar — mimics Excel's "Ready | Count: N | ΣLikes | 100% ─●───". */
export default function StatusBar({
  loading, rowCount, selectedRowNumber, totalLikes, zoomPct, onZoomChange,
}: Props) {
  return (
    <div
      data-testid="ledger-status-bar"
      style={{
        display: "flex",
        alignItems: "center",
        height: HEIGHT_PX,
        background: EXCEL.statusBarBg,
        color: EXCEL.statusBarText,
        borderTop: `1px solid ${EXCEL.gridLine}`,
        fontFamily: FONT_FAMILY,
        fontSize: 11,
        padding: "0 12px 0 72px",
        gap: 16,
      }}
    >
      <span data-testid="ledger-status-ready">{loading ? "Calculating…" : "Ready"}</span>
      <span data-testid="ledger-status-count">Count: {rowCount} posts</span>
      <span data-testid="ledger-status-selected">Selected: row {selectedRowNumber}</span>
      <span data-testid="ledger-status-sum">ΣLikes: {totalLikes.toLocaleString()}</span>
      <div style={{ flex: 1 }} />
      <span data-testid="ledger-status-zoom">{zoomPct}%</span>
      <input
        data-testid="ledger-zoom-slider"
        type="range"
        min={ZOOM_MIN_PCT}
        max={ZOOM_MAX_PCT}
        step={ZOOM_STEP_PCT}
        value={zoomPct}
        onChange={(e) => onZoomChange(Number.parseInt(e.target.value, 10))}
        style={{ width: 120 }}
      />
    </div>
  );
}
