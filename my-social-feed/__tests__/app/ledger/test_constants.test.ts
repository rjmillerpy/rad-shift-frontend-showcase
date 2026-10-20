import {
  COLUMN_LABELS,
  COLUMN_WIDTHS,
  MEDIA_TYPE_ICON,
  PADDING_COLUMNS,
  PADDING_COLUMN_COUNT,
  SHEETS,
  ZOOM_DEFAULT_PCT,
  ZOOM_MAX_PCT,
  ZOOM_MIN_PCT,
  columnLetter,
} from "@/app/ledger/constants";
import { COLUMN_KEYS, SHEET_KEYS } from "@/app/ledger/types";

describe("Ledger constants", () => {
  it("has a width and label for every column key", () => {
    for (const c of COLUMN_KEYS) {
      expect(COLUMN_WIDTHS[c]).toBeGreaterThan(0);
      expect(COLUMN_LABELS[c]).toBeTruthy();
    }
  });

  it("has one SHEETS entry per SheetKey", () => {
    const sheetKeys = SHEETS.map((s) => s.key).sort();
    expect(sheetKeys).toEqual([...SHEET_KEYS].sort());
  });

  it("marks personal sheets as requiring auth", () => {
    const requiresAuth = Object.fromEntries(SHEETS.map((s) => [s.key, s.requiresAuth]));
    expect(requiresAuth.algo).toBe(false);
    expect(requiresAuth.following).toBe(true);
    expect(requiresAuth.saved).toBe(true);
    expect(requiresAuth.drafts).toBe(true);
  });

  it("provides an icon for every media kind used in classifyMedia", () => {
    expect(MEDIA_TYPE_ICON.text).toBeTruthy();
    expect(MEDIA_TYPE_ICON.image).toBeTruthy();
    expect(MEDIA_TYPE_ICON.video).toBeTruthy();
    expect(MEDIA_TYPE_ICON.audio).toBeTruthy();
  });

  it("keeps the zoom range self-consistent", () => {
    expect(ZOOM_MIN_PCT).toBeLessThan(ZOOM_DEFAULT_PCT);
    expect(ZOOM_DEFAULT_PCT).toBeLessThan(ZOOM_MAX_PCT);
  });
});

describe("columnLetter", () => {
  it.each<[number, string]>([
    [0,  "A"],
    [5,  "F"],
    [6,  "G"],
    [25, "Z"],
    [26, "AA"],
    [27, "AB"],
    [51, "AZ"],
    [52, "BA"],
    [701, "ZZ"],
    [702, "AAA"],
  ])("index %i → %s", (i, expected) => {
    expect(columnLetter(i)).toBe(expected);
  });

  it("clamps negatives to empty string", () => {
    expect(columnLetter(-1)).toBe("");
  });
});

describe("PADDING_COLUMNS", () => {
  it("starts at G (index right after F)", () => {
    expect(PADDING_COLUMNS[0]).toBe("G");
  });

  it("has PADDING_COLUMN_COUNT entries", () => {
    expect(PADDING_COLUMNS).toHaveLength(PADDING_COLUMN_COUNT);
  });

  it("extends past Z into two-letter labels", () => {
    // With 50 padding columns starting at index 6 (G), the last one is at
    // index 55 → "BD".
    expect(PADDING_COLUMNS[PADDING_COLUMNS.length - 1]).toMatch(/^[A-Z]{2}$/);
  });
});
