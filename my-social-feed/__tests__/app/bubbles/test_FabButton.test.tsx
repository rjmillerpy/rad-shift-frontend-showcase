import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FabButton from "@/app/bubbles/FabButton";

const baseProps = {
  testId: "fab-new-post",
  title: "New post",
  onClick: jest.fn(),
  bottom: 30,
  background: "rgb(0, 123, 255)",
  color: "rgb(255, 255, 255)",
  border: "none",
  fontSize: 28,
  label: "+",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FabButton", () => {
  it("renders the label inside a button named by its title", () => {
    render(<FabButton {...baseProps} />);
    const button = screen.getByRole("button", { name: "New post" });
    expect(button).toHaveTextContent("+");
    expect(button).toHaveAttribute("title", "New post");
    expect(button).toHaveAttribute("data-testid", "fab-new-post");
  });

  it("calls onClick once per click", () => {
    render(<FabButton {...baseProps} />);
    fireEvent.click(screen.getByTestId("fab-new-post"));
    fireEvent.click(screen.getByTestId("fab-new-post"));
    expect(baseProps.onClick).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["new-post slot", 30, "30px"],
    ["stacked login slot", 100, "100px"],
    ["flush with the bottom", 0, "0px"],
  ])("positions the %s at bottom=%i", (_name, bottom, expected) => {
    render(<FabButton {...baseProps} bottom={bottom} />);
    expect(screen.getByTestId("fab-new-post").style.bottom).toBe(expected);
  });

  it.each([
    ["plus", "fab-plus", "New post", "+", 28, "28px"],
    ["login", "fab-login", "Log in", "Log in", 12, "12px"],
  ])("applies the %s variant's test id, title, label and font size", (_name, testId, title, label, fontSize, expectedSize) => {
    render(<FabButton {...baseProps} testId={testId} title={title} label={label} fontSize={fontSize} />);
    const button = screen.getByTestId(testId);
    expect(button).toHaveAccessibleName(title);
    expect(button).toHaveTextContent(label);
    expect(button.style.fontSize).toBe(expectedSize);
  });

  it("applies the supplied colours and border", () => {
    render(<FabButton {...baseProps} background="rgb(34, 34, 34)" color="rgb(200, 200, 200)" border="1px solid rgb(85, 85, 85)" />);
    const button = screen.getByTestId("fab-new-post");
    expect(button).toHaveStyle({
      backgroundColor: "rgb(34, 34, 34)",
      color: "rgb(200, 200, 200)",
      border: "1px solid rgb(85, 85, 85)",
    });
  });
});
