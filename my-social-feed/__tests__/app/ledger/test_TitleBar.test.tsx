import React from "react";
import { render, screen } from "@testing-library/react";
import TitleBar from "@/app/ledger/TitleBar";
import { APP_WORDMARK, FAKE_WORKBOOK_TITLE } from "@/app/ledger/constants";

describe("TitleBar", () => {
  it("renders the fake workbook title", () => {
    render(<TitleBar />);
    expect(screen.getByTestId("ledger-workbook-title").textContent).toBe(FAKE_WORKBOOK_TITLE);
  });

  it("shows the wordmark (not literally 'Excel') and autosave hint", () => {
    render(<TitleBar />);
    expect(screen.getByTestId("ledger-wordmark").textContent).toBe(APP_WORDMARK);
    expect(screen.queryByText("Excel")).not.toBeInTheDocument();
    expect(screen.getByText(/Autosave/i)).toBeInTheDocument();
  });

  it("workbook filename does not include the word 'Excel'", () => {
    expect(FAKE_WORKBOOK_TITLE.toLowerCase()).not.toContain("excel");
  });
});
