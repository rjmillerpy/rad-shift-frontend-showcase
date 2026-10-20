import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import HalfPicker from "@/app/amble/character/HalfPicker";
import { DEFAULT_HALF } from "@/app/amble/character/constants";

describe("HalfPicker", () => {
  it("renders the picker column for the given side", () => {
    render(<HalfPicker side="left" half={DEFAULT_HALF} onChange={jest.fn()} />);
    expect(screen.getByTestId("amble-half-picker-left")).toBeInTheDocument();
  });

  it.each<[string, string, keyof typeof DEFAULT_HALF]>([
    ["gender",   "left-gender-girl",   "gender"],
    ["skin",     "left-skin-copper",   "skin_tone"],
    ["hair",     "left-hair-long",     "hairstyle"],
    ["clothing", "left-clothing-dress","clothing"],
  ])("clicking a %s swatch fires onChange with the new value", (_group, testid, key) => {
    const onChange = jest.fn();
    render(<HalfPicker side="left" half={DEFAULT_HALF} onChange={onChange} />);
    fireEvent.click(screen.getByTestId(`amble-swatch-${testid}`));
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated[key]).not.toBe(DEFAULT_HALF[key]);
    // Every other attribute stays the same (immutable update — rule 12).
    for (const otherKey of Object.keys(DEFAULT_HALF) as (keyof typeof DEFAULT_HALF)[]) {
      if (otherKey !== key) expect(updated[otherKey]).toBe(DEFAULT_HALF[otherKey]);
    }
  });

  it("shows aria-pressed on the currently selected swatch", () => {
    render(<HalfPicker side="left" half={DEFAULT_HALF} onChange={jest.fn()} />);
    expect(
      screen.getByTestId("amble-swatch-left-gender-boy").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByTestId("amble-swatch-left-gender-girl").getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
