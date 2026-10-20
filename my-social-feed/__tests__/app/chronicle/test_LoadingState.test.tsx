import React from "react";
import { render, screen, within } from "@testing-library/react";
import LoadingState from "@/app/chronicle/LoadingState";

describe("LoadingState", () => {
  it("announces that the chronicle is being written", () => {
    render(<LoadingState />);
    const panel = screen.getByTestId("loading-state");
    expect(within(panel).getByText("Chronicling...")).toBeInTheDocument();
    expect(within(panel).getByText("🤔")).toBeInTheDocument();
  });

  it.each([
    ["what the chronicler is doing", /reading through your feed, finding connections between posts/],
    ["why it may take a while", /takes longer on local hardware/],
  ])("explains %s", (_name, pattern) => {
    render(<LoadingState />);
    expect(within(screen.getByTestId("loading-state")).getByText(pattern)).toBeInTheDocument();
  });

  it("fills the viewport and centres the panel", () => {
    render(<LoadingState />);
    const wrapper = screen.getByTestId("loading-state").parentElement!;
    expect(wrapper.style.minHeight).toBe("100vh");
    expect(wrapper.style.alignItems).toBe("center");
    expect(wrapper.style.justifyContent).toBe("center");
  });

  it("has no interactive controls while loading", () => {
    render(<LoadingState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
