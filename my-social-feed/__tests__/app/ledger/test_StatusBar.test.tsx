import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import StatusBar from "@/app/ledger/StatusBar";

function props(overrides = {}) {
  return {
    loading: false,
    rowCount: 42,
    selectedRowNumber: 3,
    totalLikes: 663,
    zoomPct: 100,
    onZoomChange: jest.fn(),
    ...overrides,
  };
}

describe("StatusBar", () => {
  it("shows Ready when not loading", () => {
    render(<StatusBar {...props()} />);
    expect(screen.getByTestId("ledger-status-ready").textContent).toBe("Ready");
  });

  it("shows Calculating… when loading", () => {
    render(<StatusBar {...props({ loading: true })} />);
    expect(screen.getByTestId("ledger-status-ready").textContent).toMatch(/Calculat/i);
  });

  it("reports row count, selected row, and ΣLikes", () => {
    render(<StatusBar {...props()} />);
    expect(screen.getByTestId("ledger-status-count").textContent).toContain("42");
    expect(screen.getByTestId("ledger-status-selected").textContent).toContain("3");
    expect(screen.getByTestId("ledger-status-sum").textContent).toContain("663");
  });

  it("fires onZoomChange with a parsed integer", () => {
    const p = props();
    render(<StatusBar {...p} />);
    fireEvent.change(screen.getByTestId("ledger-zoom-slider"), { target: { value: "150" } });
    expect(p.onZoomChange).toHaveBeenCalledWith(150);
  });
});
