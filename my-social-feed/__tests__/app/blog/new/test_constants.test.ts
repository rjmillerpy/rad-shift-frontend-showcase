import {
  AI_BANNED,
  OG_DESCRIPTION_MAX_CHARS,
  OG_TITLE_MAX_CHARS,
  OPTIMAL_TIMES,
  SEO_DESCRIPTION_MAX_CHARS,
  SEO_TITLE_MAX_CHARS,
  TOOLBAR,
  WORDS_PER_MINUTE,
  type ToolbarButton,
} from "@/app/blog/new/constants";

// Fixture for the exported type, so `tsc` checks its shape.
const customButton: ToolbarButton = {
  label: "Underline", cmd: "u", icon: "U", style: { textDecoration: "underline" },
};

describe("AI_BANNED", () => {
  it("is a non-empty list with no repeats", () => {
    expect(AI_BANNED.length).toBeGreaterThan(0);
    expect(new Set(AI_BANNED).size).toBe(AI_BANNED.length);
  });

  it("holds trimmed, lowercase phrases so they match lowercased post text", () => {
    for (const phrase of AI_BANNED) {
      expect(phrase).toBe(phrase.trim().toLowerCase());
      expect(phrase).not.toBe("");
    }
  });

  test.each(["delve", "leverage", "paradigm shift", "seamless"])("bans '%s'", (phrase) => {
    expect(AI_BANNED).toContain(phrase);
  });
});

describe("OPTIMAL_TIMES", () => {
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  it("suggests at least one slot, each on a different real weekday", () => {
    expect(OPTIMAL_TIMES.length).toBeGreaterThan(0);
    expect(new Set(OPTIMAL_TIMES.map((t) => t.day)).size).toBe(OPTIMAL_TIMES.length);
    for (const t of OPTIMAL_TIMES) expect(WEEKDAYS).toContain(t.day);
  });

  it("gives every slot a 12-hour time and a reason", () => {
    for (const t of OPTIMAL_TIMES) {
      expect(t.time).toMatch(/^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/);
      expect(t.reason.trim()).not.toBe("");
    }
  });
});

describe("TOOLBAR", () => {
  it("has unique commands and labels", () => {
    expect(TOOLBAR.length).toBeGreaterThan(0);
    expect(new Set(TOOLBAR.map((b) => b.cmd)).size).toBe(TOOLBAR.length);
    expect(new Set(TOOLBAR.map((b) => b.label)).size).toBe(TOOLBAR.length);
  });

  it("gives every button a label, an icon, an HTML tag name and a style object", () => {
    for (const b of [...TOOLBAR, customButton]) {
      expect(b.label.trim()).not.toBe("");
      expect(b.icon.trim()).not.toBe("");
      expect(b.cmd).toMatch(/^[a-z][a-z0-9]*$/);
      expect(typeof b.style).toBe("object");
      expect(b.style).not.toBeNull();
    }
  });

  test.each(["strong", "em", "h2", "h3", "blockquote", "ul", "code", "a", "img", "hr"])(
    "includes the '%s' command the editor knows how to insert",
    (cmd) => {
      expect(TOOLBAR.map((b) => b.cmd)).toContain(cmd);
    },
  );
});

describe("character limits and reading speed", () => {
  test.each([
    ["SEO_TITLE_MAX_CHARS", SEO_TITLE_MAX_CHARS],
    ["SEO_DESCRIPTION_MAX_CHARS", SEO_DESCRIPTION_MAX_CHARS],
    ["OG_TITLE_MAX_CHARS", OG_TITLE_MAX_CHARS],
    ["OG_DESCRIPTION_MAX_CHARS", OG_DESCRIPTION_MAX_CHARS],
    ["WORDS_PER_MINUTE", WORDS_PER_MINUTE],
  ])("%s is a positive whole number", (_name, value) => {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
  });

  it("allows more room for descriptions than for titles", () => {
    expect(SEO_TITLE_MAX_CHARS).toBeLessThan(SEO_DESCRIPTION_MAX_CHARS);
    expect(OG_TITLE_MAX_CHARS).toBeLessThan(OG_DESCRIPTION_MAX_CHARS);
  });

  it("allows social cards at least as much room as search results", () => {
    expect(OG_TITLE_MAX_CHARS).toBeGreaterThanOrEqual(SEO_TITLE_MAX_CHARS);
    expect(OG_DESCRIPTION_MAX_CHARS).toBeGreaterThanOrEqual(SEO_DESCRIPTION_MAX_CHARS);
  });
});
