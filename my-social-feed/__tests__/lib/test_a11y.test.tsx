import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { buttonProps, UNSTYLED_BUTTON } from "@/lib/a11y";

function Card({ onOpen, onInner }: { onOpen: () => void; onInner?: () => void }) {
  return (
    <div {...buttonProps(onOpen)} data-testid="card">
      card <button onClick={onInner}>inner</button>
    </div>
  );
}

describe("buttonProps", () => {
  it("makes the element a focusable button", () => {
    render(<Card onOpen={jest.fn()} />);
    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabindex", "0");
  });

  it.each(["Enter", " "])("activates on %j", (key) => {
    const onOpen = jest.fn();
    render(<Card onOpen={onOpen} />);
    fireEvent.keyDown(screen.getByTestId("card"), { key });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("activates on click", () => {
    const onOpen = jest.fn();
    render(<Card onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("card"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onOpen = jest.fn();
    render(<Card onOpen={onOpen} />);
    fireEvent.keyDown(screen.getByTestId("card"), { key: "a" });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("ignores Enter pressed on a button inside it", () => {
    const onOpen = jest.fn();
    render(<Card onOpen={onOpen} />);
    fireEvent.keyDown(screen.getByText("inner"), { key: "Enter" });
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe("UNSTYLED_BUTTON", () => {
  it("strips the browser's button chrome", () => {
    expect(UNSTYLED_BUTTON).toMatchObject({ background: "none", border: "none", padding: 0, font: "inherit" });
  });
});
