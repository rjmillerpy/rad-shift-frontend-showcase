import { renderHook, act } from "@testing-library/react";
import { useGridResize } from "@/app/ledger/useGridResize";
import { COLUMN_WIDTHS, ROW_HEIGHT_PX } from "@/app/ledger/constants";

function fireMouseMove(clientX: number, clientY: number) {
  window.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY }));
}
function fireMouseUp() {
  window.dispatchEvent(new MouseEvent("mouseup"));
}

describe("useGridResize", () => {
  it("returns default column widths and row heights before any drag", () => {
    const { result } = renderHook(() => useGridResize());
    expect(result.current.getColWidth("A")).toBe(COLUMN_WIDTHS.A);
    expect(result.current.getColWidth("G")).toBeGreaterThan(0);
    expect(result.current.getRowHeight(0)).toBe(ROW_HEIGHT_PX);
  });

  it("resizing column A widens when dragging right", () => {
    const { result } = renderHook(() => useGridResize());
    const startWidth = result.current.getColWidth("A");
    act(() => {
      result.current.startColResize("A", { clientX: 100, preventDefault: () => {} });
    });
    act(() => {
      fireMouseMove(150, 0);
    });
    expect(result.current.getColWidth("A")).toBe(startWidth + 50);
    act(() => { fireMouseUp(); });
  });

  it("resizing a row taller updates height", () => {
    const { result } = renderHook(() => useGridResize());
    act(() => {
      result.current.startRowResize(3, { clientY: 100, preventDefault: () => {} });
    });
    act(() => {
      fireMouseMove(0, 130);
    });
    expect(result.current.getRowHeight(3)).toBe(ROW_HEIGHT_PX + 30);
    act(() => { fireMouseUp(); });
  });

  it("respects minimum column width (does not go below the floor)", () => {
    const { result } = renderHook(() => useGridResize());
    act(() => {
      result.current.startColResize("A", { clientX: 500, preventDefault: () => {} });
    });
    act(() => {
      fireMouseMove(-9999, 0);
    });
    // Should clamp to MIN_COL_WIDTH_PX (30)
    expect(result.current.getColWidth("A")).toBe(30);
    act(() => { fireMouseUp(); });
  });

  it("mouseup stops the drag so later moves have no effect", () => {
    const { result } = renderHook(() => useGridResize());
    act(() => {
      result.current.startColResize("B", { clientX: 200, preventDefault: () => {} });
    });
    act(() => { fireMouseMove(250, 0); fireMouseUp(); });
    const afterUp = result.current.getColWidth("B");
    act(() => { fireMouseMove(400, 0); });
    expect(result.current.getColWidth("B")).toBe(afterUp);
  });
});
