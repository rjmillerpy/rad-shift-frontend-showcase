import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { toolTemplates } from "@/lib/widgetTemplates/tools";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.tool;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["python", "Unit Converter & Calculator", /^(def |import |class )/m],
  ["javascript", "Markdown Previewer", /document\.getElementById\(/],
  ["typescript", "Password Generator (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["c", "Text Statistics Analyzer (C)", /^#include <stdio\.h>$/m],
  ["sql", "Data Transformation Tool", /^(SELECT|CREATE TABLE)\b/m],
  ["ruby", "JSON Formatter & Validator (Ruby)", /\bputs\b/],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return toolTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("toolTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(toolTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = toolTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(toolTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(toolTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = toolTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(toolTemplates[language], language);
    expect(html).toContain(JSON.stringify(toolTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(toolTemplates)).size).toBe(STARTERS.length);
  });
});
