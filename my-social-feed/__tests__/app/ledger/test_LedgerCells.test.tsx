import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LedgerCell, RowNumberCell } from "@/app/ledger/LedgerCells";

function cell(overrides: Partial<React.ComponentProps<typeof LedgerCell>> = {}) {
  const props = {
    testId: "c",
    width: 80,
    height: 20,
    content: "hello",
    isEditing: false,
    editDraft: "draft",
    onStartEdit: jest.fn(),
    onChangeEdit: jest.fn(),
    onCommitEdit: jest.fn(),
    onCancelEdit: jest.fn(),
    ...overrides,
  };
  render(<LedgerCell {...props} />);
  return { el: screen.getByTestId("c"), props };
}

describe("RowNumberCell", () => {
  it("shows the row number", () => {
    render(<RowNumberCell rowNumber={7} height={20} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});

describe("LedgerCell", () => {
  it("shows its content when not editing", () => {
    expect(cell().el).toHaveTextContent("hello");
  });

  it("shows the editor with the draft while editing", () => {
    cell({ isEditing: true });
    expect(screen.getByDisplayValue("draft")).toBeInTheDocument();
  });

  it("double-click starts editing without bubbling to the row", () => {
    const rowHandler = jest.fn();
    const onStartEdit = jest.fn();
    render(
      <div onDoubleClick={rowHandler}>
        <LedgerCell testId="c" width={80} height={20} content="x" isEditing={false} editDraft=""
          onStartEdit={onStartEdit} onChangeEdit={jest.fn()} onCommitEdit={jest.fn()} onCancelEdit={jest.fn()} />
      </div>,
    );
    fireEvent.doubleClick(screen.getByTestId("c"));
    expect(onStartEdit).toHaveBeenCalledTimes(1);
    expect(rowHandler).not.toHaveBeenCalled();
  });

  it("calls onClick when given one", () => {
    const onClick = jest.fn();
    fireEvent.click(cell({ onClick }).el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["left", "flex-start"],
    ["right", "flex-end"],
    ["center", "center"],
  ] as const)("aligns %s content to %s", (align, justify) => {
    expect(cell({ align }).el.style.justifyContent).toBe(justify);
  });

  it("outlines the selected cell only", () => {
    expect(cell({ outlined: true }).el.style.outline).toContain("2px solid");
  });

  it("has no outline otherwise", () => {
    expect(cell().el.style.outline).toBe("none");
  });
});
