import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IconActionButton from "@/components/IconActionButton";

const baseProps = {
  iconSrc: "/icons/like.png",
  iconAlt: "Like",
  iconSize: 28,
  title: "Like this post",
  onClick: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("IconActionButton", () => {
  it("renders a titled button containing the icon at the requested size", () => {
    render(<IconActionButton {...baseProps} />);
    const button = screen.getByRole("button", { name: "Like" });
    expect(button).toHaveAttribute("title", "Like this post");
    const icon = screen.getByAltText("Like");
    expect(button).toContainElement(icon);
    expect(icon).toHaveAttribute("src", "/icons/like.png");
    expect(icon).toHaveAttribute("width", "28");
    expect(icon).toHaveAttribute("height", "28");
  });

  it("calls onClick once per click, whether the button or its icon is clicked", () => {
    render(<IconActionButton {...baseProps} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByAltText("Like"));
    expect(baseProps.onClick).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["no filter by default", undefined, "none"],
    ["the given tint", "sepia(1) saturate(300%)", "sepia(1) saturate(300%)"],
  ])("applies %s to the icon", (_label, filter, expected) => {
    render(<IconActionButton {...baseProps} filter={filter} />);
    expect(screen.getByAltText("Like").style.filter).toBe(expected);
  });

  it.each([
    ["the 200ms default", undefined, "filter 0.2s ease-in-out"],
    ["a slower 500ms", 500, "filter 0.5s ease-in-out"],
    ["an instant 0ms", 0, "filter 0s ease-in-out"],
    ["a 1.5s", 1500, "filter 1.5s ease-in-out"],
  ])("animates the tint with %s transition", (_label, transitionMs, expected) => {
    render(<IconActionButton {...baseProps} transitionMs={transitionMs} />);
    expect(screen.getByAltText("Like").style.transition).toBe(expected);
  });

  it.each([
    ["onMouseEnter", fireEvent.mouseEnter],
    ["onMouseLeave", fireEvent.mouseLeave],
    ["onMouseDown", fireEvent.mouseDown],
    ["onMouseUp", fireEvent.mouseUp],
  ] as const)("forwards %s from the icon and nothing else", (prop, fire) => {
    const handlers = { onMouseEnter: jest.fn(), onMouseLeave: jest.fn(), onMouseDown: jest.fn(), onMouseUp: jest.fn() };
    render(<IconActionButton {...baseProps} {...handlers} />);
    fire(screen.getByAltText("Like"));
    for (const [name, handler] of Object.entries(handlers)) {
      expect(handler).toHaveBeenCalledTimes(name === prop ? 1 : 0);
    }
    expect(baseProps.onClick).not.toHaveBeenCalled();
  });

  it("tolerates hover and press without optional handlers", () => {
    render(<IconActionButton {...baseProps} />);
    const icon = screen.getByAltText("Like");
    expect(() => {
      fireEvent.mouseEnter(icon);
      fireEvent.mouseDown(icon);
      fireEvent.mouseUp(icon);
      fireEvent.mouseLeave(icon);
    }).not.toThrow();
  });

  it("puts the id and class hooks on the button when given", () => {
    render(<IconActionButton {...baseProps} buttonId="share-button" buttonClassName="share pulse" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("id", "share-button");
    expect(button).toHaveClass("share", "pulse");
  });

  it("adds no id or class when the hooks are omitted", () => {
    render(<IconActionButton {...baseProps} />);
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("id");
    expect(button).not.toHaveAttribute("class");
  });

  it("renders as a bare icon with no button chrome", () => {
    render(<IconActionButton {...baseProps} />);
    expect(screen.getByRole("button")).toHaveStyle({ background: "none", padding: "0px", cursor: "pointer" });
  });
});
