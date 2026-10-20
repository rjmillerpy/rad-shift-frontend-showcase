import {
  escapeRegExp,
  computeHeadlineScore,
  computeKeywordDensity,
  computeLsi,
  computeSeoScore,
  extractExternalLinks,
  filterAuthorityLinks,
  findAiCliches,
  findClickbaitWarnings,
  generateKeywordSuggestions,
  htmlToPlainText,
  inspectImageAltText,
  keywordInH2,
} from "@/components/seoAnalysis";

describe("htmlToPlainText", () => {
  it.each([
    ["strips tags", "<p>hello <b>world</b></p>", "hello world"],
    ["collapses whitespace", "  a\n\nb   c  ", "a b c"],
    ["handles empty input", "", ""],
    ["keeps a lone < that opens no tag", "a < b", "a < b"],
  ])("%s", (_name, input, expected) => {
    expect(htmlToPlainText(input)).toBe(expected);
  });

  it("stays fast on a hostile paste of unclosed tags", () => {
    const hostile = "<".repeat(50_000);
    const started = Date.now();
    expect(htmlToPlainText(hostile)).toBe(hostile);
    expect(Date.now() - started).toBeLessThan(500); // the old /<[^>]+>/ took seconds here
  });
});

describe("findAiCliches", () => {
  it("finds a single cliché phrase", () => {
    const result = findAiCliches("we need to delve into this");
    expect(result).toContain("delve");
  });

  it("finds multiple clichés", () => {
    const found = findAiCliches("delve into synergy and robust cutting-edge");
    expect(found).toEqual(expect.arrayContaining(["delve", "synergy", "robust", "cutting-edge"]));
  });

  it("is case-insensitive", () => {
    expect(findAiCliches("UTILIZE this")).toContain("utilize");
  });

  it("returns [] for clean text", () => {
    expect(findAiCliches("this is a normal sentence about cats")).toEqual([]);
  });
});

describe("computeKeywordDensity", () => {
  it("returns 0 when no keyword", () => {
    expect(computeKeywordDensity("some text here", "", 3)).toBe(0);
  });

  it("returns 0 when wordCount is 0", () => {
    expect(computeKeywordDensity("", "cats", 0)).toBe(0);
  });

  it("counts occurrences case-insensitively", () => {
    const density = computeKeywordDensity("cats CATS cats", "cats", 3);
    expect(density).toBe(100); // 3 matches / 3 words * 100
  });

  it("escapes regex special characters in the keyword", () => {
    const density = computeKeywordDensity("a.b a.b a.b", "a.b", 3);
    expect(density).toBe(100);
  });
});

describe("keywordInH2", () => {
  it("returns true when keyword appears in any h2", () => {
    const html = "<h2>Intro to Cats</h2><p>body</p><h2>More cats</h2>";
    expect(keywordInH2(html, "cats")).toBe(true);
  });

  it("returns false when keyword is only in the body", () => {
    expect(keywordInH2("<h2>Dogs</h2><p>and cats</p>", "cats")).toBe(false);
  });

  it("returns false when no keyword", () => {
    expect(keywordInH2("<h2>Anything</h2>", "")).toBe(false);
  });
});

describe("computeHeadlineScore", () => {
  it("does not credit length or keyword bonuses for an empty title", () => {
    // An empty title vacuously passes the "not clickbait" check so it gets
    // 15 points there, but nothing for length, keyword, digits, or word count.
    const empty = computeHeadlineScore("", "cats");
    const good = computeHeadlineScore("How to raise cats — 5 tips", "cats");
    expect(good).toBeGreaterThan(empty);
    expect(empty).toBeLessThan(30);
  });

  it("adds points for keyword in title", () => {
    const withKw = computeHeadlineScore("How to raise cats — a guide", "cats");
    const withoutKw = computeHeadlineScore("How to raise dogs — a guide", "cats");
    expect(withKw).toBeGreaterThan(withoutKw);
  });

  it("adds points for power words", () => {
    expect(computeHeadlineScore("How to write", "")).toBeGreaterThan(computeHeadlineScore("Something dull", ""));
  });

  it("caps at 100", () => {
    // A well-crafted title should not exceed 100 even with every bonus.
    expect(computeHeadlineScore("How to build 5 best cats tools guide", "cats")).toBeLessThanOrEqual(100);
  });
});

describe("findClickbaitWarnings", () => {
  it("flags a clickbait pattern", () => {
    expect(findClickbaitWarnings("You won't believe this trick").length).toBeGreaterThan(0);
  });

  it("returns [] for clean titles", () => {
    expect(findClickbaitWarnings("A pragmatic guide to Rust")).toEqual([]);
  });
});

describe("extractExternalLinks", () => {
  it("pulls URLs out of href attributes", () => {
    const html = '<a href="https://a.com">a</a> <a href="https://b.com/x">b</a>';
    expect(extractExternalLinks(html)).toEqual(["https://a.com", "https://b.com/x"]);
  });

  it("returns [] when there are no links", () => {
    expect(extractExternalLinks("<p>no links here</p>")).toEqual([]);
  });
});

describe("filterAuthorityLinks", () => {
  it("keeps only high-authority URLs", () => {
    const links = [
      "https://en.wikipedia.org/wiki/Cats",
      "https://random.example.com/x",
      "https://harvard.edu/y",
    ];
    const authority = filterAuthorityLinks(links);
    expect(authority).toContain("https://en.wikipedia.org/wiki/Cats");
    expect(authority).toContain("https://harvard.edu/y");
    expect(authority).not.toContain("https://random.example.com/x");
  });
});

describe("inspectImageAltText", () => {
  it("counts images and finds missing alt", () => {
    const html = '<img src="a.png"><img src="b.png" alt="">';
    const result = inspectImageAltText(html, "");
    expect(result.total).toBe(2);
    expect(result.missing.length).toBe(2);
  });

  it("counts images with keyword in alt", () => {
    const html = '<img src="a.png" alt="cats playing"><img src="b.png" alt="a dog">';
    const result = inspectImageAltText(html, "cats");
    expect(result.withKeyword).toEqual(["cats playing"]);
  });
});

describe("computeLsi", () => {
  it("returns empty when no keyword", () => {
    expect(computeLsi("some text", "")).toEqual({ found: [], suggested: [] });
  });

  it("splits synonyms into found vs suggested", () => {
    // "blog" → synonyms include "article", "post", "content", ...
    const result = computeLsi("this is a good article about cats", "blog");
    expect(result.found).toContain("article");
    expect(result.suggested).not.toContain("article");
  });
});

describe("generateKeywordSuggestions", () => {
  it("returns [] when no keyword", () => {
    expect(generateKeywordSuggestions("")).toEqual([]);
  });

  it("prepends prefixes and appends suffixes", () => {
    const suggestions = generateKeywordSuggestions("rust");
    expect(suggestions.some((s) => s.startsWith("how to"))).toBe(true);
    expect(suggestions.some((s) => s.endsWith("guide"))).toBe(true);
  });

  it("deduplicates and caps the list", () => {
    const suggestions = generateKeywordSuggestions("cats");
    expect(new Set(suggestions).size).toBe(suggestions.length);
    expect(suggestions.length).toBeLessThanOrEqual(12);
  });
});

describe("computeSeoScore", () => {
  const baseline = {
    keywordInTitle: false,
    keywordInH2: false,
    keywordInMeta: false,
    keywordInSlug: false,
    keywordDensity: 0,
    headlineScore: 0,
    aiClichesFound: 0,
    authorityLinks: 0,
    imageAltMissing: 0,
    imageTotal: 0,
    lsiFound: 0,
    wordCount: 0,
  };

  it("gives credit for keyword-in-title", () => {
    expect(computeSeoScore({ ...baseline, keywordInTitle: true })).toBeGreaterThan(0);
  });

  it("adds points for authority links", () => {
    const with_ = computeSeoScore({ ...baseline, authorityLinks: 3 });
    const without = computeSeoScore(baseline);
    expect(with_).toBeGreaterThan(without);
  });

  it("caps at 100", () => {
    const maxed = computeSeoScore({
      keywordInTitle: true, keywordInH2: true, keywordInMeta: true, keywordInSlug: true,
      keywordDensity: 1.5, headlineScore: 90,
      aiClichesFound: 0, authorityLinks: 3,
      imageAltMissing: 0, imageTotal: 5,
      lsiFound: 3, wordCount: 500,
    });
    expect(maxed).toBe(100);
  });

  it("no AI clichés adds points; presence removes them", () => {
    const clean = computeSeoScore({ ...baseline, aiClichesFound: 0 });
    const dirty = computeSeoScore({ ...baseline, aiClichesFound: 3 });
    expect(clean).toBeGreaterThan(dirty);
  });
});


describe("escapeRegExp", () => {
  it.each(["c++", "(draft", "a.b", "50% off?", "[x]"])("%s matches itself literally", (text) => {
    expect(new RegExp(escapeRegExp(text)).test(`before ${text} after`)).toBe(true);
  });
});

describe("keyword handling with regex characters", () => {
  it("measures density for a keyword like 'c++'", () => {
    expect(computeKeywordDensity("learn c++ today, c++ rocks", "c++", 5)).toBe(40);
  });
});
