import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { dbConnectorTemplates } from "@/lib/widgetTemplates/dbConnectors";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.db_connector;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["sql", "Database Explorer", /^(SELECT|CREATE TABLE)\b/m],
  ["python", "Database Connector (Python)", /^(def |import |class )/m],
  ["javascript", "IndexedDB Data Store (JavaScript)", /document\.getElementById\(/],
  ["typescript", "Typed Data Layer (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["c", "In-Memory Database (C)", /^#include <stdio\.h>$/m],
  ["golang", "In-Memory Database (Go)", /^package main$/m],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return dbConnectorTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("dbConnectorTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(dbConnectorTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = dbConnectorTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(dbConnectorTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(dbConnectorTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = dbConnectorTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(dbConnectorTemplates[language], language);
    expect(html).toContain(JSON.stringify(dbConnectorTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(dbConnectorTemplates)).size).toBe(STARTERS.length);
  });
});
