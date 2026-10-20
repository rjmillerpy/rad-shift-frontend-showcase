import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/Modal";

function renderModal(onClose = jest.fn()) {
  render(
    <>
      <button>opener</button>
      <Modal label="Report post" onClose={onClose}>
        <button>inside</button>
      </Modal>
    </>,
  );
  return onClose;
}

describe("Modal", () => {
  it("is a labelled modal dialog", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "Report post" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus into the dialog when it opens", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("gives focus back to what had it when it closes", () => {
    const { rerender } = render(<button>opener</button>);
    const opener = screen.getByText("opener");
    opener.focus();
    rerender(
      <>
        <button>opener</button>
        <Modal label="x" onClose={jest.fn()}>body</Modal>
      </>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
    rerender(<button>opener</button>);
    expect(screen.getByText("opener")).toHaveFocus();
  });

  it("closes on Escape", () => {
    const onClose = renderModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onClose = renderModal();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on a click outside the panel", () => {
    const onClose = renderModal();
    fireEvent.pointerDown(screen.getByText("opener"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open on a click inside the panel", () => {
    const onClose = renderModal();
    fireEvent.pointerDown(screen.getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stops listening once closed", () => {
    const onClose = jest.fn();
    const { unmount } = render(<Modal label="x" onClose={onClose}>body</Modal>);
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
