import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import Ribbon from "@/app/ledger/Ribbon";

function defaults() {
  return {
    search: "",
    onSearchChange: jest.fn(),
    sort: "recent" as const,
    onSortChange: jest.fn(),
    typeFilter: "all" as const,
    onTypeFilterChange: jest.fn(),
    loading: false,
    onRefresh: jest.fn(),
    onFunAction: jest.fn(),
  };
}

describe("Ribbon", () => {
  it("fires onSearchChange when typing", () => {
    const p = defaults();
    render(<Ribbon {...p} />);
    fireEvent.change(screen.getByTestId("ledger-search"), { target: { value: "cats" } });
    expect(p.onSearchChange).toHaveBeenCalledWith("cats");
  });

  it("fires onSortChange when selecting a sort", () => {
    const p = defaults();
    render(<Ribbon {...p} />);
    fireEvent.change(screen.getByTestId("ledger-sort"), { target: { value: "likes" } });
    expect(p.onSortChange).toHaveBeenCalledWith("likes");
  });

  it("fires onTypeFilterChange when selecting a type", () => {
    const p = defaults();
    render(<Ribbon {...p} />);
    fireEvent.change(screen.getByTestId("ledger-type"), { target: { value: "image" } });
    expect(p.onTypeFilterChange).toHaveBeenCalledWith("image");
  });

  it("calls onRefresh when the refresh button is clicked", () => {
    const p = defaults();
    render(<Ribbon {...p} />);
    fireEvent.click(screen.getByTestId("ledger-refresh"));
    expect(p.onRefresh).toHaveBeenCalled();
  });

  it("disables refresh while loading and shows 'Refreshing…'", () => {
    const p = { ...defaults(), loading: true };
    render(<Ribbon {...p} />);
    const btn = screen.getByTestId("ledger-refresh") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toMatch(/Refreshing/);
  });

  it("renders decorative menu tabs (File, Home, Insert, …)", () => {
    render(<Ribbon {...defaults()} />);
    expect(screen.getByTestId("ledger-tab-file")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-tab-home")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-tab-insert")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-tab-formulas")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-tab-help")).toBeInTheDocument();
  });

  it("clicking a menu tab switches the toolbar to that tab's groups", () => {
    render(<Ribbon {...defaults()} />);
    // Home is active on mount — Font group is one of its groups
    expect(screen.getByTestId("ledger-toolbar-home")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-group-font")).toBeInTheDocument();
    // Switch to Formulas
    fireEvent.click(screen.getByTestId("ledger-tab-formulas"));
    expect(screen.getByTestId("ledger-toolbar-formulas")).toBeInTheDocument();
    // Home's Font group is gone; Formulas' AutoSum button is there
    expect(screen.queryByTestId("ledger-group-font")).not.toBeInTheDocument();
    expect(screen.getByTestId("ledger-fun-autosum")).toBeInTheDocument();
  });

  it("clicking a fake tab button (not Home) fires a toast", () => {
    const p = defaults();
    render(<Ribbon {...p} />);
    fireEvent.click(screen.getByTestId("ledger-tab-help"));
    fireEvent.click(screen.getByTestId("ledger-fun-about"));
    expect(p.onFunAction).toHaveBeenCalledWith(expect.stringMatching(/Sheets/));
  });

  it("renders fake toolbar buttons in labelled groups", () => {
    render(<Ribbon {...defaults()} />);
    expect(screen.getByTestId("ledger-group-clipboard")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-group-font")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-group-alignment")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-group-number")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-group-insert")).toBeInTheDocument();
    // A representative button per group
    expect(screen.getByTestId("ledger-fun-save")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-fun-bold")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-fun-merge")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-fun-chart")).toBeInTheDocument();
  });

  it("clicking a fake button fires onFunAction with the toast text", () => {
    const p = defaults();
    render(<Ribbon {...p} />);
    fireEvent.click(screen.getByTestId("ledger-fun-save"));
    expect(p.onFunAction).toHaveBeenCalledWith(expect.stringMatching(/Autosaved/));
  });
});
