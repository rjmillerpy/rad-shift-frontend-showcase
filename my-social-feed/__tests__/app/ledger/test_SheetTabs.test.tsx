import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import SheetTabs from "@/app/ledger/SheetTabs";
import { SHEETS } from "@/app/ledger/constants";

describe("SheetTabs", () => {
  it("renders one tab per sheet", () => {
    render(<SheetTabs active="algo" onChange={jest.fn()} />);
    for (const s of SHEETS) {
      expect(screen.getByTestId(`ledger-sheet-${s.key}`)).toBeInTheDocument();
    }
  });

  it("fires onChange when a tab is clicked", () => {
    const onChange = jest.fn();
    render(<SheetTabs active="algo" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("ledger-sheet-drafts"));
    expect(onChange).toHaveBeenCalledWith("drafts");
  });
});
