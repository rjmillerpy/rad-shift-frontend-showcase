import { renderHook, act } from "@testing-library/react";
import { useCellSelection } from "@/app/ledger/useCellSelection";

function pressKey(key: string, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  Object.defineProperty(event, "target", { value: target, writable: false });
  window.dispatchEvent(event);
}

describe("useCellSelection", () => {
  const onOpenRow = jest.fn();
  const onFocusSearch = jest.fn();

  beforeEach(() => { jest.clearAllMocks(); });

  it("starts at row 0, column A", () => {
    const { result } = renderHook(() => useCellSelection({ rowCount: 5, onOpenRow, onFocusSearch }));
    expect(result.current.selection).toEqual({ row: 0, col: "A" });
  });

  it("moves down on ArrowDown, up on ArrowUp", () => {
    const { result } = renderHook(() => useCellSelection({ rowCount: 5, onOpenRow, onFocusSearch }));
    act(() => { pressKey("ArrowDown"); });
    expect(result.current.selection.row).toBe(1);
    act(() => { pressKey("ArrowDown"); pressKey("ArrowDown"); });
    expect(result.current.selection.row).toBe(3);
    act(() => { pressKey("ArrowUp"); });
    expect(result.current.selection.row).toBe(2);
  });

  it("clamps at the last row", () => {
    const { result } = renderHook(() => useCellSelection({ rowCount: 3, onOpenRow, onFocusSearch }));
    for (let i = 0; i < 10; i++) act(() => pressKey("ArrowDown"));
    expect(result.current.selection.row).toBe(2);
  });

  it("moves right through columns and stops at F", () => {
    const { result } = renderHook(() => useCellSelection({ rowCount: 3, onOpenRow, onFocusSearch }));
    for (let i = 0; i < 20; i++) act(() => pressKey("ArrowRight"));
    expect(result.current.selection.col).toBe("F");
  });

  it("Enter calls onOpenRow with the current row index", () => {
    renderHook(() => useCellSelection({ rowCount: 5, onOpenRow, onFocusSearch }));
    // Split into separate acts so React commits state between key presses.
    // With a single batched act, the updater ran twice under strict mode.
    act(() => pressKey("ArrowDown"));
    act(() => pressKey("ArrowDown"));
    act(() => pressKey("Enter"));
    expect(onOpenRow).toHaveBeenCalledWith(2);
  });

  it("'/' calls onFocusSearch", () => {
    renderHook(() => useCellSelection({ rowCount: 5, onOpenRow, onFocusSearch }));
    act(() => pressKey("/"));
    expect(onFocusSearch).toHaveBeenCalled();
  });

  it("ignores keys when focus is inside an input", () => {
    renderHook(() => useCellSelection({ rowCount: 5, onOpenRow, onFocusSearch }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => pressKey("/", input));
    expect(onFocusSearch).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("clamps selection when rowCount shrinks", () => {
    const { result, rerender } = renderHook(
      ({ rowCount }: { rowCount: number }) => useCellSelection({ rowCount, onOpenRow, onFocusSearch }),
      { initialProps: { rowCount: 10 } },
    );
    act(() => { for (let i = 0; i < 7; i++) pressKey("ArrowDown"); });
    expect(result.current.selection.row).toBe(7);
    rerender({ rowCount: 3 });
    expect(result.current.selection.row).toBe(2);
  });
});
