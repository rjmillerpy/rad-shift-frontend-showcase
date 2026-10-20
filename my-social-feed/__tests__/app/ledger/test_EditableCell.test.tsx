import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import EditableCell from "@/app/ledger/EditableCell";

function makeProps() {
  return {
    value: "hello",
    align: "left" as const,
    onChange: jest.fn(),
    onCommit: jest.fn(),
    onCancel: jest.fn(),
  };
}

describe("EditableCell", () => {
  it("renders an input with the given value", () => {
    render(<EditableCell {...makeProps()} />);
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("fires onChange when typing", () => {
    const p = makeProps();
    render(<EditableCell {...p} />);
    fireEvent.change(screen.getByDisplayValue("hello"), { target: { value: "world" } });
    expect(p.onChange).toHaveBeenCalledWith("world");
  });

  it("Enter commits", () => {
    const p = makeProps();
    render(<EditableCell {...p} />);
    fireEvent.keyDown(screen.getByDisplayValue("hello"), { key: "Enter" });
    expect(p.onCommit).toHaveBeenCalled();
  });

  it("Escape cancels", () => {
    const p = makeProps();
    render(<EditableCell {...p} />);
    fireEvent.keyDown(screen.getByDisplayValue("hello"), { key: "Escape" });
    expect(p.onCancel).toHaveBeenCalled();
  });

  it("blur commits (Excel behavior)", () => {
    const p = makeProps();
    render(<EditableCell {...p} />);
    fireEvent.blur(screen.getByDisplayValue("hello"));
    expect(p.onCommit).toHaveBeenCalled();
  });
});
