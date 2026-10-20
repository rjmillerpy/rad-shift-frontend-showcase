import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OverviewBubble from "@/app/bubbles/OverviewBubble";
import type { Bubble } from "@/app/bubbles/types";

const makeBubble = (overrides: Partial<Bubble> = {}): Bubble => ({
  label: "Technology",
  color: "#e74c3c",
  isFeed: false,
  x: 200,
  y: 150,
  vx: 0.2,
  vy: 0.1,
  size: 80,
  ...overrides,
});

describe("OverviewBubble", () => {
  it("renders the topic label as a titled button", () => {
    render(<OverviewBubble bubble={makeBubble()} dimIfZoomed={false} onClick={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Technology" });
    expect(button).toHaveAttribute("title", "Technology");
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<OverviewBubble bubble={makeBubble()} dimIfZoomed={false} onClick={onClick} />);
    fireEvent.click(screen.getByTitle("Technology"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["80px bubble", { x: 200, y: 150, size: 80 }, { left: "160px", top: "110px", size: "80px" }],
    ["90px feed-sized bubble", { x: 45, y: 45, size: 90 }, { left: "0px", top: "0px", size: "90px" }],
    ["odd size", { x: 100, y: 100, size: 75 }, { left: "62.5px", top: "62.5px", size: "75px" }],
  ])("centres a %s on its (x, y) position", (_name, geometry, expected) => {
    render(<OverviewBubble bubble={makeBubble(geometry)} dimIfZoomed={false} onClick={jest.fn()} />);
    const { style } = screen.getByTitle("Technology");
    expect(style.left).toBe(expected.left);
    expect(style.top).toBe(expected.top);
    expect(style.width).toBe(expected.size);
    expect(style.height).toBe(expected.size);
  });

  it.each([
    ["dimmed while zoomed", true, "0.25"],
    ["fully opaque in the overview", false, "1"],
  ])("is %s", (_name, dimIfZoomed, opacity) => {
    render(<OverviewBubble bubble={makeBubble()} dimIfZoomed={dimIfZoomed} onClick={jest.fn()} />);
    expect(screen.getByTitle("Technology").style.opacity).toBe(opacity);
  });

  it.each([
    ["feed bubble", true, { fontWeight: "bold", fontSize: "14px", zIndex: "10", borderWidth: "3px" }],
    ["general bubble", false, { fontWeight: "normal", fontSize: "12px", zIndex: "1", borderWidth: "2px" }],
  ])("styles a %s distinctly", (_name, isFeed, expected) => {
    render(<OverviewBubble bubble={makeBubble({ isFeed })} dimIfZoomed={false} onClick={jest.fn()} />);
    const { style } = screen.getByTitle("Technology");
    expect(style.fontWeight).toBe(expected.fontWeight);
    expect(style.fontSize).toBe(expected.fontSize);
    expect(style.zIndex).toBe(expected.zIndex);
    expect(style.border).toContain(expected.borderWidth);
  });

  it("scales up on hover and back down when the pointer leaves", () => {
    render(<OverviewBubble bubble={makeBubble()} dimIfZoomed={false} onClick={jest.fn()} />);
    const button = screen.getByTitle("Technology");
    const restingShadow = button.style.boxShadow;

    fireEvent.mouseEnter(button);
    expect(button.style.transform).toBe("scale(1.15)");
    expect(button.style.boxShadow).not.toBe(restingShadow);

    fireEvent.mouseLeave(button);
    expect(button.style.transform).toBe("scale(1)");
    expect(button.style.boxShadow).toBe(restingShadow);
  });
});
