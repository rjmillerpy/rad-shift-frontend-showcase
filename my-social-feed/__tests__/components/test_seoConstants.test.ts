import {
  AI_BANNED_PHRASES, CLICKBAIT_PATTERNS, HIGH_AUTHORITY_DOMAINS, KEYWORD_DENSITY_MAX, KEYWORD_DENSITY_MIN,
  LSI_SYNONYMS, MAX_WORD_COUNT_SEO, MIN_WORD_COUNT_SEO, SCORE_GOOD_THRESHOLD, SCORE_OK_THRESHOLD,
} from "@/components/seoConstants";

const LISTS: [string, string[]][] = [
  ["AI_BANNED_PHRASES", AI_BANNED_PHRASES],
  ["HIGH_AUTHORITY_DOMAINS", HIGH_AUTHORITY_DOMAINS],
  ...Object.entries(LSI_SYNONYMS).map(([key, words]): [string, string[]] => [`LSI_SYNONYMS.${key}`, words]),
];

describe.each(LISTS)("%s", (_name, list) => {
  it("is non-empty with no duplicates", () => {
    expect(list.length).toBeGreaterThan(0);
    expect(new Set(list).size).toBe(list.length);
  });

  // The analysis lower-cases the text before substring-matching, so an entry with capitals or
  // stray whitespace could never match.
  it("holds only trimmed, lower-case, non-empty entries", () => {
    expect(list.filter((entry) => entry === "" || entry !== entry.trim() || entry !== entry.toLowerCase())).toEqual([]);
  });
});

describe("HIGH_AUTHORITY_DOMAINS", () => {
  it.each(HIGH_AUTHORITY_DOMAINS)("%s is a bare domain or TLD, without scheme, path or leading dot", (domain) => {
    expect(domain).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/);
  });

  it.each([
    "https://en.wikipedia.org/wiki/SEO", "https://www.cdc.gov/flu", "https://cs.stanford.edu/people",
    "https://www.bbc.com/news", "https://github.com/vercel/next.js", "https://developer.mdn.mozilla.org/docs",
  ])("recognises %s by substring", (url) => {
    expect(HIGH_AUTHORITY_DOMAINS.some((domain) => url.includes(domain))).toBe(true);
  });
});

describe("CLICKBAIT_PATTERNS", () => {
  const hits = (headline: string) => CLICKBAIT_PATTERNS.filter((pattern) => pattern.test(headline));

  it("matches 'everything you know … wrong' within a phrase, not across a whole page", () => {
    expect(hits("Everything you know about sleep is wrong")).toHaveLength(1);
    expect(hits(`Everything you know ${"x".repeat(200)} wrong`)).toHaveLength(0);
  });

  // A /g or /y regex keeps lastIndex between .test() calls and would give alternating answers.
  it.each(CLICKBAIT_PATTERNS)("%s is case-insensitive and stateless", (pattern) => {
    expect(pattern.flags).toBe("i");
  });

  it.each([
    "You Won't Believe What This Dev Did", "SHOCKING results from our benchmark", "A mind-blowing CSS trick",
    "This one weird trick speeds up builds", "Doctors hate this standing desk", "Number 7 will surprise you",
    "What happens next is wild", "10 reasons why Rust wins", "The secret that seniors know",
    "You need to see this layout", "It will blow your mind", "TypeScript changed my life",
    "Everything you know about caching is wrong",
  ])("flags %j", (headline) => {
    expect(hits(headline).length).toBeGreaterThanOrEqual(1);
  });

  it("has a headline that triggers each individual pattern, so none is dead", () => {
    const sample = "you won't believe shocking mind-blowing this one weird doctors hate number 3 will what happens next "
      + "5 reasons why secret that you need to see will blow your mind changed my life everything you know is wrong";
    expect(hits(sample)).toHaveLength(CLICKBAIT_PATTERNS.length);
  });

  it.each([
    "How to Build a Blog with Next.js", "Understanding database indexes", "Release notes for version 2.4",
    "Reasons to prefer composition", "", "A number of improvements",
  ])("leaves the plain headline %j alone", (headline) => {
    expect(hits(headline)).toEqual([]);
  });
});

describe("LSI_SYNONYMS", () => {
  it.each(Object.entries(LSI_SYNONYMS))("%s offers several variations that are not the word itself", (word, synonyms) => {
    expect(word).toBe(word.toLowerCase().trim());
    expect(synonyms.length).toBeGreaterThanOrEqual(3);
    expect(synonyms).not.toContain(word);
  });
});

describe("thresholds", () => {
  it("orders the score bands inside the 0-100 scale", () => {
    expect(SCORE_OK_THRESHOLD).toBeGreaterThan(0);
    expect(SCORE_GOOD_THRESHOLD).toBeGreaterThan(SCORE_OK_THRESHOLD);
    expect(SCORE_GOOD_THRESHOLD).toBeLessThan(100);
  });

  it("defines a keyword-density window that is a sane percentage range", () => {
    expect(KEYWORD_DENSITY_MIN).toBeGreaterThan(0);
    expect(KEYWORD_DENSITY_MAX).toBeGreaterThan(KEYWORD_DENSITY_MIN);
    expect(KEYWORD_DENSITY_MAX).toBeLessThan(100);
  });

  it("defines a word-count window with room between minimum and maximum", () => {
    expect(MIN_WORD_COUNT_SEO).toBeGreaterThan(0);
    expect(MAX_WORD_COUNT_SEO).toBeGreaterThan(MIN_WORD_COUNT_SEO);
  });
});
