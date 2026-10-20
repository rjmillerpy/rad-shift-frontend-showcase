import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import ColumnResizeOverlays, { computeStripPositions } from "@/app/ledger/ColumnResizeOverlays";
import { COLUMN_KEYS } from "@/app/ledger/types";
import { PADDING_COLUMNS, ROW_NUMBER_COL_WIDTH_PX } from "@/app/ledger/constants";

describe("computeStripPositions", () => {
  it("starts at the right edge of column A after the row-number gutter", () => {
    const positions = computeStripPositions(() => 100);
    const firstContent = positions.find((p) => p.letter === "A");
    expect(firstContent?.rightEdgePx).toBe(ROW_NUMBER_COL_WIDTH_PX + 100);
  });

  it("accumulates widths across content and padding columns", () => {
    const positions = computeStripPositions(() => 50);
    const last = positions[positions.length - 1];
    const totalCols = COLUMN_KEYS.length + PADDING_COLUMNS.length;
    expect(last?.rightEdgePx).toBe(ROW_NUMBER_COL_WIDTH_PX + totalCols * 50);
  });

  it("emits one strip per content and padding column", () => {
    const positions = computeStripPositions(() => 40);
    expect(positions).toHaveLength(COLUMN_KEYS.length + PADDING_COLUMNS.length);
  });
});

describe("ColumnResizeOverlays", () => {
  it("renders one drag strip per column", () => {
    render(<ColumnResizeOverlays getColWidth={() => 80} onColResizeStart={jest.fn()} />);
    for (const c of COLUMN_KEYS) {
      expect(screen.getByTestId(`ledger-col-resize-${c}`)).toBeInTheDocument();
    }
    // Sample a padding column too.
    expect(screen.getByTestId(`ledger-col-resize-${PADDING_COLUMNS[0]}`)).toBeInTheDocument();
  });

  it("fires onColResizeStart with the column letter on mousedown", () => {
    const start = jest.fn();
    render(<ColumnResizeOverlays getColWidth={() => 80} onColResizeStart={start} />);
    fireEvent.mouseDown(screen.getByTestId("ledger-col-resize-C"));
    expect(start).toHaveBeenCalledWith("C", expect.anything());
  });
});
