import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import { gameTemplates } from "@/lib/widgetTemplates/games";
import { CATEGORY_META, commentBlock } from "@/lib/widgetTemplates/meta";

const { emoji } = CATEGORY_META.game;

// One row per starter: language id, the title in its header comment, and a construct that
// shows the code really is written in that language.
const STARTERS: [string, string, RegExp][] = [
  ["python", "Number Guessing Game", /^(def |import |class )/m],
  ["javascript", "Snake Game", /document\.getElementById\(/],
  ["typescript", "Pong Game (TypeScript)", /^(interface|type) \w+|: (string|number|void)\b/m],
  ["c", "Tic-Tac-Toe (C)", /^#include <stdio\.h>$/m],
  ["basic", "Number Guessing Game in BASIC", /^\d+ PRINT /m],
  ["rust", "Dungeon Crawler (Rust)", /^fn main\(\)/m],
  ["golang", "Game of Life (Go)", /^package main$/m],
];

const codeLines = (language: string) => {
  const marker = commentBlock(language, [""]).trim();
  return gameTemplates[language].split("\n").filter((line) => line.trim() && !line.trim().startsWith(marker));
};

describe("gameTemplates", () => {
  it("offers a starter for exactly the listed languages", () => {
    expect(Object.keys(gameTemplates).sort()).toEqual(STARTERS.map(([language]) => language).sort());
  });

  it.each(STARTERS)("%s: header comment is in the language's own dialect and reads %j", (language, title) => {
    const header = gameTemplates[language].split("\n")[0];
    expect(header.startsWith(commentBlock(language, [emoji]))).toBe(true);
    expect(header.endsWith(` ${title}`)).toBe(true);
  });

  it.each(STARTERS)("%s: is written in that language", (language, _title, construct) => {
    expect(gameTemplates[language]).toMatch(construct);
  });

  it.each(STARTERS)("%s: has a how-to-modify guide and a real program, not just comments", (language) => {
    expect(gameTemplates[language].split("\n")).toContain(commentBlock(language, ["--- How to modify ---"]));
    expect(codeLines(language).length).toBeGreaterThanOrEqual(15);
  });

  it.each(STARTERS)("%s: has no trailing whitespace or blank first/last line", (language) => {
    const code = gameTemplates[language];
    expect(code).toBe(code.trim());
    expect(code).not.toMatch(/[ \t]$/m);
  });

  it.each(STARTERS)("%s: embeds intact in its dedicated browser runtime", (language) => {
    const html = wrapCodeForBrowser(gameTemplates[language], language);
    expect(html).toContain(JSON.stringify(gameTemplates[language]));
    expect(html).not.toContain("does not have a browser runtime");
  });

  it("gives every language a different starter", () => {
    expect(new Set(Object.values(gameTemplates)).size).toBe(STARTERS.length);
  });
});
