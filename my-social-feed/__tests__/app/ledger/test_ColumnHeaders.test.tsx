import React from "react";
import { render, screen } from "@testing-library/react";
import ColumnHeaders from "@/app/ledger/ColumnHeaders";
import { COLUMN_KEYS } from "@/app/ledger/types";
import { COLUMN_LABELS } from "@/app/ledger/constants";

describe("ColumnHeaders", () => {
  it("renders one header cell per column letter", () => {
    render(<ColumnHeaders getColWidth={() => 80} />);
    for (const c of COLUMN_KEYS) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
  });

  it("uses the friendly label as the title attribute", () => {
    render(<ColumnHeaders getColWidth={() => 80} />);
    for (const c of COLUMN_KEYS) {
      const cell = screen.getByText(c);
      expect(cell.title).toBe(COLUMN_LABELS[c]);
    }
  });

  it("renders extra empty padding columns G–L for horizontal scroll room", () => {
    render(<ColumnHeaders getColWidth={() => 80} />);
    expect(screen.getByTestId("ledger-header-pad-G")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-header-pad-L")).toBeInTheDocument();
  });

});
