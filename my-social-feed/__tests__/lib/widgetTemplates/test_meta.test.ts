import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { CATEGORY_META, LANG_RUNTIME_DESC, commentBlock, langDesc } from "@/lib/widgetTemplates/meta";
import { CATEGORY_MAP } from "@/lib/widgetTemplates/types";

describe("CATEGORY_META", () => {
  it("describes exactly the categories the API knows", () => {
    expect(Object.keys(CATEGORY_META).sort()).toEqual(Object.values(CATEGORY_MAP).sort());
  });

  it.each(Object.entries(CATEGORY_META))("%s has an emoji and a description", (_category, meta) => {
    expect(meta.emoji.trim()).not.toBe("");
    expect(meta.emoji).toMatch(/\p{Extended_Pictographic}/u);
    expect(meta.description.trim().length).toBeGreaterThan(10);
  });

  it.each(["emoji", "description"] as const)("gives every category a distinct %s", (field) => {
    const values = Object.values(CATEGORY_META).map((meta) => meta[field]);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("LANG_RUNTIME_DESC", () => {
  it.each(Object.entries(LANG_RUNTIME_DESC))("%s is described as running in the browser", (_lang, description) => {
    expect(description).toMatch(/in the browser/);
  });

  it.each(Object.keys(LANG_RUNTIME_DESC))("%s has a dedicated runtime behind its description", (lang) => {
    expect(wrapCodeForBrowser("x", lang)).not.toContain("does not have a browser runtime");
  });
});

describe("langDesc", () => {
  it.each([
    ["python", "game", "Interactive game widget — Runs via Pyodide (CPython compiled to WebAssembly) in the browser"],
    ["sql", "db_connector", "Database query interface — Executed via sql.js (SQLite compiled to WebAssembly) in the browser"],
    ["react", "social", "Social interaction component — Rendered via React 18 with Babel transpilation in the browser"],
  ])("joins the category and runtime descriptions for %s in %s", (lang, category, expected) => {
    expect(langDesc(lang, category)).toBe(expected);
  });

  it.each(Object.keys(CATEGORY_META))("uses the %s category description as the lead-in", (category) => {
    expect(langDesc("javascript", category)).toBe(
      `${CATEGORY_META[category].description} — ${LANG_RUNTIME_DESC.javascript}`,
    );
  });

  it.each([
    ["an unknown category", "python", "nonsense", LANG_RUNTIME_DESC.python],
    ["a picker label instead of an API value", "python", "Games", LANG_RUNTIME_DESC.python],
    ["an empty category", "c", "", LANG_RUNTIME_DESC.c],
    ["an unknown language", "cobol", "tool", "Utility / productivity tool — cobol code rendered in the browser"],
    ["an unknown language and category", "cobol", "nonsense", "cobol code rendered in the browser"],
  ])("handles %s", (_label, lang, category, expected) => {
    expect(langDesc(lang, category)).toBe(expected);
  });
});

describe("commentBlock", () => {
  it.each([
    ["sql", "-- "],
    ["basic", "REM "],
    ["c", "// "],
    ["cpp", "// "],
    ["rust", "// "],
    ["golang", "// "],
    ["javascript", "// "],
    ["typescript", "// "],
    ["react", "// "],
    ["nodejs", "// "],
    ["php", "// "],
    ["python", "# "],
    ["ruby", "# "],
    ["anything-else", "# "],
  ])("prefixes every line with the %s comment marker %j", (lang, marker) => {
    expect(commentBlock(lang, ["first", "second line", ""])).toBe(`${marker}first\n${marker}second line\n${marker}`);
  });

  it.each(["sql", "basic", "javascript", "python"])("returns an empty string for no lines (%s)", (lang) => {
    expect(commentBlock(lang, [])).toBe("");
  });

  it("does not add a trailing newline", () => {
    expect(commentBlock("python", ["only"])).toBe("# only");
  });
});
