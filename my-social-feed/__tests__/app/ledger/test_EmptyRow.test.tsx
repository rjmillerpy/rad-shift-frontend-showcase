import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import EmptyRow from "@/app/ledger/EmptyRow";

function makeProps() {
  return {
    rowIndex: 2,
    rowNumber: 27,
    height: 24,
    editingCol: null,
    editDraft: "",
    getEdit: () => undefined,
    getColWidth: (_: string) => 80,
    onRowResizeStart: jest.fn(),
    onStartEdit: jest.fn(),
    onChangeEdit: jest.fn(),
    onCommitEdit: jest.fn(),
    onCancelEdit: jest.fn(),
  };
}

describe("EmptyRow", () => {
  it("renders with the given row number", () => {
    const p = makeProps();
    render(<EmptyRow {...p} />);
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-empty-row-2")).toBeInTheDocument();
  });

  it("row-resize overlay fires onRowResizeStart from the shared full-row strip", () => {
    const p = makeProps();
    render(<EmptyRow {...p} />);
    fireEvent.mouseDown(screen.getByTestId("ledger-row-resize-2"));
    expect(p.onRowResizeStart).toHaveBeenCalledWith(2, expect.anything());
  });

  it("double-clicking an empty cell fires onStartEdit for that column", () => {
    const p = makeProps();
    render(<EmptyRow {...p} />);
    fireEvent.doubleClick(screen.getByTestId("ledger-empty-cell-2-H"));
    expect(p.onStartEdit).toHaveBeenCalledWith(2, "H");
  });

  it("renders saved edits, and Enter commits inside the edit input", () => {
    const p = { ...makeProps(), getEdit: (_r: number, c: string) => (c === "K" ? "grocery list" : undefined) };
    render(<EmptyRow {...p} />);
    expect(screen.getByTestId("ledger-empty-cell-2-K").textContent).toBe("grocery list");
  });
});
