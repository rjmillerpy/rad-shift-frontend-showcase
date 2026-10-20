import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { visualizationTemplates } from "@/lib/widgetTemplates/visualizations";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.visualization;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["python", "Data Visualizer (Python)", /^(def |import |class )/m],
  ["javascript", "Interactive Charts (JavaScript)", /document\.getElementById\(/],
  ["typescript", "Dashboard Builder (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["c", "ASCII Chart Renderer (C)", /^#include <stdio\.h>$/m],
  ["sql", "Data Analytics Dashboard (SQL)", /^(SELECT|CREATE TABLE)\b/m],
  ["ruby", "Data Pipeline (Ruby)", /\bputs\b/],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return visualizationTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("visualizationTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(visualizationTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = visualizationTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(visualizationTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(visualizationTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = visualizationTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(visualizationTemplates[language], language);
    expect(html).toContain(JSON.stringify(visualizationTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(visualizationTemplates)).size).toBe(STARTERS.length);
  });
});
