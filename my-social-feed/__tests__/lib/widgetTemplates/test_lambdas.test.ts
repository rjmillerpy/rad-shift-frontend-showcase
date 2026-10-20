import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { lambdaTemplates } from "@/lib/widgetTemplates/lambdas";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.lambda;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["python", "Lambda Function Handler (Python)", /^(def |import |class )/m],
  ["javascript", "Lambda Function Handler (JavaScript)", /document\.getElementById\(/],
  ["typescript", "Lambda Function Handler (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["golang", "Lambda Function Handler (Go)", /^package main$/m],
  ["rust", "Lambda Function Handler (Rust)", /^fn main\(\)/m],
  ["c", "Lambda Function Handler (C)", /^#include <stdio\.h>$/m],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return lambdaTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("lambdaTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(lambdaTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = lambdaTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(lambdaTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(lambdaTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = lambdaTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(lambdaTemplates[language], language);
    expect(html).toContain(JSON.stringify(lambdaTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(lambdaTemplates)).size).toBe(STARTERS.length);
  });
});
