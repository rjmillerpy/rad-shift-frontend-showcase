import {
  getLinkCardTheme,
  getBadgeLetter,
  type LinkCardTheme,
} from "@/lib/linkCardThemes";

const PLATFORM_CASES: { platform: string; expectedId: LinkCardTheme["id"] }[] = [
  { platform: "reddit", expectedId: "reddit" },
  { platform: "pinterest", expectedId: "pinterest" },
  { platform: "x", expectedId: "x" },
  { platform: "x_search", expectedId: "x" },  // search results render with X branding
];

describe("getLinkCardTheme — platform matches", () => {
  test.each(PLATFORM_CASES)(
    "returns $expectedId theme for platform '$platform'",
    ({ platform, expectedId }) => {
      const theme = getLinkCardTheme(
        { platform, name: "x", url: null, label: "x" },
        { url: "https://x.com/y" },
      );
      expect(theme.id).toBe(expectedId);
    },
  );
});

const HOSTNAME_CASES = [
  { hostname: "news.ycombinator.com", expectedId: "hackernews" as const },
  { hostname: "ycombinator.com", expectedId: "hackernews" as const },
  { hostname: "twitter.com", expectedId: "x" as const },
  { hostname: "x.com", expectedId: "x" as const },
];

describe("getLinkCardTheme — hostname matches for web platform", () => {
  test.each(HOSTNAME_CASES)(
    "returns $expectedId theme for hostname '$hostname'",
    ({ hostname, expectedId }) => {
      const theme = getLinkCardTheme(
        { platform: "web", name: "HN", url: null, label: "Hacker News" },
        { url: "https://x.com/y", hostname },
      );
      expect(theme.id).toBe(expectedId);
    },
  );
});

describe("getLinkCardTheme — fallback", () => {
  it("returns generic theme when nothing matches", () => {
    const theme = getLinkCardTheme(
      { platform: "web", name: "Random", url: null, label: "Random" },
      { url: "https://elsewhere.example.com/y", hostname: "elsewhere.example.com" },
    );
    expect(theme.id).toBe("generic");
  });

  it("returns generic theme when source and linkCard are undefined", () => {
    const theme = getLinkCardTheme(undefined, undefined);
    expect(theme.id).toBe("generic");
  });

  it("platform match wins over hostname match", () => {
    // Source claims reddit, but hostname is hackernews — platform should win
    const theme = getLinkCardTheme(
      { platform: "reddit", name: "r/x", url: null, label: "x" },
      { url: "https://news.ycombinator.com/x", hostname: "news.ycombinator.com" },
    );
    expect(theme.id).toBe("reddit");
  });
});

describe("getBadgeLetter", () => {
  it("returns the themed badge text when set", () => {
    const theme = getLinkCardTheme(
      { platform: "reddit", name: "r/x", url: null, label: "x" },
      { url: "https://x" },
    );
    expect(getBadgeLetter(theme, undefined, undefined)).toBe("r/");
  });

  it("falls back to first letter of hostname for generic theme", () => {
    const theme = getLinkCardTheme(undefined, undefined);
    expect(
      getBadgeLetter(theme, { url: "https://x", hostname: "example.com" }, undefined),
    ).toBe("E");
  });

  it("falls back to '?' when nothing usable is available", () => {
    const theme = getLinkCardTheme(undefined, undefined);
    expect(getBadgeLetter(theme, undefined, undefined)).toBe("?");
  });
});
