import { renderHook } from "@testing-library/react";
import { DEFAULT_MAP_ID, useMap } from "@/app/amble/hooks/useMap";

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe("useMap", () => {
  it("returns the town's bundled map by default", () => {
    const { result } = renderHook(() => useMap(DEFAULT_MAP_ID));
    expect(result.current.error).toBeNull();
    expect(result.current.map?.id).toBe(DEFAULT_MAP_ID);
    // Which anchors a town has is its own business; assert the field exists.
    expect(Array.isArray(result.current.map?.entities)).toBe(true);
  });

  it("returns error and null map for an unknown id", () => {
    const { result } = renderHook(() => useMap("does_not_exist"));
    expect(result.current.map).toBeNull();
    expect(result.current.error).toMatch(/unknown/i);
  });

  it("caches the parsed manifest across re-renders with the same id", () => {
    const { result, rerender } = renderHook(({ id }) => useMap(id), {
      initialProps: { id: DEFAULT_MAP_ID },
    });
    const first = result.current.map;
    rerender({ id: DEFAULT_MAP_ID });
    expect(result.current.map).toBe(first);
  });
});
