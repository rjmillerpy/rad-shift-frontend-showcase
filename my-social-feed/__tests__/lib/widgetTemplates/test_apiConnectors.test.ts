import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { apiConnectorTemplates } from "@/lib/widgetTemplates/apiConnectors";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.api_connector;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["python", "REST API Client (Python)", /^(def |import |class )/m],
  ["javascript", "API Explorer", /document\.getElementById\(/],
  ["typescript", "Typed API Client (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["c", "HTTP Request Parser (C)", /^#include <stdio\.h>$/m],
  ["golang", "API Client (Go)", /^package main$/m],
  ["rust", "HTTP Client Builder (Rust)", /^fn main\(\)/m],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return apiConnectorTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("apiConnectorTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(apiConnectorTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = apiConnectorTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(apiConnectorTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(apiConnectorTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = apiConnectorTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(apiConnectorTemplates[language], language);
    expect(html).toContain(JSON.stringify(apiConnectorTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(apiConnectorTemplates)).size).toBe(STARTERS.length);
  });
});
