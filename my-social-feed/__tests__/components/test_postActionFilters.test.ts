import * as filters from "@/components/postActionFilters";

const FILTER_NAMES = Object.entries(filters).flatMap(([name, value]): [string, string][] =>
  typeof value === "string" ? [[name, value]] : []);

/** Value of the last `fn(...)` in a CSS filter list, as a number (percentages become fractions). */
function amount(filter: string, fn: string): number {
  const values = Array.from(filter.matchAll(new RegExp(`${fn}\\((-?[\\d.]+)(%|deg)?\\)`, "g")));
  const [, value, unit] = values[values.length - 1];
  return unit === "%" ? Number(value) / 100 : Number(value);
}

describe("post action filter tints", () => {
  it("exports a tint for every toolbar state the post actions use", () => {
    expect(FILTER_NAMES.map(([name]) => name).sort()).toEqual([
      "BROWN_ACTIVE", "BROWN_HOVER", "LAUGH_ACTIVE_FILTER", "LAUGH_HOVER_FILTER", "LAUGH_IDLE_FILTER",
      "LIKE_ACTIVE", "LIKE_HOVER", "RED_ACTIVE", "RED_HOVER", "REPOST_ACTIVE_OR_HOVER",
      "SAVE_ACTIVE", "SAVE_HOVER", "TAG_ACTIVE", "TAG_HOVER",
    ]);
  });

  it.each(FILTER_NAMES)("%s is a well-formed CSS filter list", (_name, value) => {
    const functions = value.split(" ");
    expect(functions.length).toBeGreaterThanOrEqual(2);
    for (const fn of functions) {
      expect(fn).toMatch(/^(brightness|contrast|sepia|saturate)\(\d+(\.\d+)?%?\)$|^hue-rotate\(-?\d+deg\)$/);
    }
  });

  it.each(FILTER_NAMES)("%s survives being applied as an inline style", (_name, value) => {
    const el = document.createElement("img");
    el.style.filter = value;
    expect(el.style.filter).toBe(value);
  });

  it.each([
    ["like", filters.LIKE_HOVER, filters.LIKE_ACTIVE],
    ["save", filters.SAVE_HOVER, filters.SAVE_ACTIVE],
    ["tag", filters.TAG_HOVER, filters.TAG_ACTIVE],
    ["slop (brown)", filters.BROWN_HOVER, filters.BROWN_ACTIVE],
    ["report (red)", filters.RED_HOVER, filters.RED_ACTIVE],
    ["laugh", filters.LAUGH_HOVER_FILTER, filters.LAUGH_ACTIVE_FILTER],
  ])("%s: the active tint is more saturated than the hover tint", (_action, hover, active) => {
    expect(active).not.toBe(hover);
    expect(amount(active, "saturate")).toBeGreaterThan(amount(hover, "saturate"));
  });

  it.each([
    ["like", filters.LIKE_HOVER, filters.LIKE_ACTIVE],
    ["save", filters.SAVE_HOVER, filters.SAVE_ACTIVE],
    ["tag", filters.TAG_HOVER, filters.TAG_ACTIVE],
    ["slop (brown)", filters.BROWN_HOVER, filters.BROWN_ACTIVE],
    ["report (red)", filters.RED_HOVER, filters.RED_ACTIVE],
  ])("%s: hover and active share a hue, so the colour does not jump on click", (_action, hover, active) => {
    expect(amount(active, "hue-rotate")).toBe(amount(hover, "hue-rotate"));
  });

  it("gives each action its own hue", () => {
    const hues = [filters.LIKE_ACTIVE, filters.REPOST_ACTIVE_OR_HOVER, filters.SAVE_ACTIVE, filters.TAG_ACTIVE, filters.BROWN_ACTIVE, filters.RED_ACTIVE]
      .map((filter) => amount(filter, "hue-rotate"));
    expect(new Set(hues).size).toBe(hues.length);
  });

  it.each(["saturate", "brightness"])("laugh emoji %s steps up from idle to hover to active", (fn) => {
    const [idle, hover, active] = [filters.LAUGH_IDLE_FILTER, filters.LAUGH_HOVER_FILTER, filters.LAUGH_ACTIVE_FILTER]
      .map((filter) => amount(filter, fn));
    expect(idle).toBeLessThan(1);
    expect(hover).toBeGreaterThan(idle);
    expect(active).toBeGreaterThan(hover);
  });
});

describe("post action sizes", () => {
  it.each([
    ["icon", filters.ICON_SIZE_COMPACT, filters.ICON_SIZE_FULL],
    ["count font", filters.COUNT_FONT_COMPACT, filters.COUNT_FONT_FULL],
  ])("%s: compact is a positive whole pixel size smaller than full", (_label, compact, full) => {
    expect(Number.isInteger(compact) && Number.isInteger(full)).toBe(true);
    expect(compact).toBeGreaterThan(0);
    expect(compact).toBeLessThan(full);
  });

  it.each([
    ["compact", filters.COUNT_FONT_COMPACT, filters.ICON_SIZE_COMPACT],
    ["full", filters.COUNT_FONT_FULL, filters.ICON_SIZE_FULL],
  ])("%s: the count text is smaller than the icon beside it and still legible", (_variant, font, icon) => {
    expect(font).toBeLessThan(icon);
    expect(font).toBeGreaterThanOrEqual(10);
  });
});
