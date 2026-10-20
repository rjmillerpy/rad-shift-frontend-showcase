import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import RowResizeOverlay from "@/app/ledger/RowResizeOverlay";

describe("RowResizeOverlay", () => {
  it("fires onResizeStart with the row index on mousedown", () => {
    const onResizeStart = jest.fn();
    render(<RowResizeOverlay rowIndex={7} onResizeStart={onResizeStart} />);
    fireEvent.mouseDown(screen.getByTestId("ledger-row-resize-7"));
    expect(onResizeStart).toHaveBeenCalledWith(7, expect.anything());
  });
});
