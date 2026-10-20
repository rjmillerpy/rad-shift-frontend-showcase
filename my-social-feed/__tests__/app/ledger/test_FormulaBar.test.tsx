import React from "react";
import { render, screen } from "@testing-library/react";
import FormulaBar from "@/app/ledger/FormulaBar";

describe("FormulaBar", () => {
  it("shows the coordinate label combining col + rowNumber", () => {
    render(<FormulaBar coord={{ row: 2, col: "B" }} rowNumber={3} cellText="hello" />);
    expect(screen.getByTestId("ledger-name-box").textContent).toBe("B3");
  });

  it("shows the passed cell content", () => {
    render(<FormulaBar coord={{ row: 0, col: "A" }} rowNumber={1} cellText="some content" />);
    expect(screen.getByTestId("ledger-formula-content").textContent).toBe("some content");
  });

  it("shows the fx label", () => {
    render(<FormulaBar coord={{ row: 0, col: "A" }} rowNumber={1} cellText="" />);
    expect(screen.getByText("fx")).toBeInTheDocument();
  });
});
