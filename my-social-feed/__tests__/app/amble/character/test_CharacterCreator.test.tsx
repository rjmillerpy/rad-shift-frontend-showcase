import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CharacterCreator from "@/app/amble/character/CharacterCreator";
import { DEFAULT_HALF } from "@/app/amble/character/constants";

const INITIAL = { left: DEFAULT_HALF, right: DEFAULT_HALF };

describe("CharacterCreator", () => {
  it("renders both halves + preview + save button", () => {
    render(<CharacterCreator onSave={jest.fn()} />);
    expect(screen.getByTestId("amble-half-picker-left")).toBeInTheDocument();
    expect(screen.getByTestId("amble-half-picker-right")).toBeInTheDocument();
    expect(screen.getByTestId("amble-avatar-preview")).toBeInTheDocument();
    expect(screen.getByTestId("amble-creator-save")).toBeInTheDocument();
  });

  it("save calls onSave with the composed avatar", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<CharacterCreator initial={INITIAL} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("amble-creator-save"));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toEqual(INITIAL);
  });

  it("changing the left side sends the new half in the next save", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<CharacterCreator initial={INITIAL} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("amble-swatch-left-skin-copper"));
    fireEvent.click(screen.getByTestId("amble-creator-save"));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].left.skin_tone).toBe("copper");
    expect(onSave.mock.calls[0][0].right.skin_tone).toBe(DEFAULT_HALF.skin_tone);
  });

  it("'copy left to right' mirrors the current left side onto the right", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<CharacterCreator initial={INITIAL} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("amble-swatch-left-hair-long"));
    fireEvent.click(screen.getByTestId("amble-creator-match-left-to-right"));
    fireEvent.click(screen.getByTestId("amble-creator-save"));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const saved = onSave.mock.calls[0][0];
    expect(saved.left.hairstyle).toBe("long");
    expect(saved.right.hairstyle).toBe("long");
  });

  it("disables the save button while saving", () => {
    render(<CharacterCreator saving onSave={jest.fn()} />);
    const btn = screen.getByTestId("amble-creator-save") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toMatch(/saving/i);
  });

  it("shows a cancel button only when onCancel is provided", () => {
    const { rerender } = render(<CharacterCreator onSave={jest.fn()} />);
    expect(screen.queryByTestId("amble-creator-cancel")).not.toBeInTheDocument();
    rerender(<CharacterCreator onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("amble-creator-cancel")).toBeInTheDocument();
  });
});
