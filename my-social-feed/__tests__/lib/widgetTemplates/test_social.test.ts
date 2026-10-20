import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { socialTemplates } from "@/lib/widgetTemplates/social";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.social;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["python", "Social Feed Simulator (Python)", /^(def |import |class )/m],
  ["javascript", "Activity Feed (JavaScript)", /document\.getElementById\(/],
  ["typescript", "Social Profile Card (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["c", "Chat Simulator (C)", /^#include <stdio\.h>$/m],
  ["sql", "Social Network Schema (SQL)", /^(SELECT|CREATE TABLE)\b/m],
  ["ruby", "Social Graph Analyzer (Ruby)", /\bputs\b/],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return socialTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("socialTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(socialTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = socialTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(socialTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(socialTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = socialTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(socialTemplates[language], language);
    expect(html).toContain(JSON.stringify(socialTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(socialTemplates)).size).toBe(STARTERS.length);
  });
});
