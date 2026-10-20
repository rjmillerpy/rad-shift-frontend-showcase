import React, { useRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDismiss } from "@/hooks/useDismiss";

function Popup({ onDismiss }: { onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, onDismiss);
  return (
    <>
      <p>outside</p>
      <div ref={ref}><button>inside</button></div>
    </>
  );
}

describe("useDismiss", () => {
  it("dismisses on Escape", () => {
    const onDismiss = jest.fn();
    render(<Popup onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses on a press outside", () => {
    const onDismiss = jest.fn();
    render(<Popup onDismiss={onDismiss} />);
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("ignores presses inside and other keys", () => {
    const onDismiss = jest.fn();
    render(<Popup onDismiss={onDismiss} />);
    fireEvent.pointerDown(screen.getByText("inside"));
    fireEvent.keyDown(document, { key: "Tab" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("stops listening when unmounted", () => {
    const onDismiss = jest.fn();
    const { unmount } = render(<Popup onDismiss={onDismiss} />);
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
