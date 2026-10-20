import { COLUMN_KEYS, SHEET_KEYS, SORT_KEYS, TYPE_FILTERS } from "@/app/ledger/types";

// Locks the shape of the enums so a future contributor renaming a key can't
// accidentally break the Ledger UI without updating the tests.

describe("Ledger type unions", () => {
  it("exposes exactly the four sheets", () => {
    expect(SHEET_KEYS).toEqual(["algo", "following", "saved", "drafts"]);
  });

  it("exposes the six spreadsheet columns in order", () => {
    expect(COLUMN_KEYS).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("exposes the four sort options", () => {
    expect(SORT_KEYS).toEqual(["recent", "oldest", "likes", "reposts"]);
  });

  it("exposes the five type filters", () => {
    expect(TYPE_FILTERS).toEqual(["all", "text", "image", "video", "audio"]);
  });
});
