import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Check, ContentTab, ImagesTab, KeywordsTab, LinksTab, OpenGraphTab, OverviewTab, ScoreBar,
} from "@/components/SeoToolkitTabs";

const GREEN = "#28a745";
const AMBER = "#ffc107";
const RED = "#dc3545";

/** The ✓/✗ shown beside a checklist line. */
const mark = (text: string | RegExp) => screen.getByText(text).previousElementSibling?.textContent;

const overview = {
  seoScore: 80, headlineScore: 55, keyword: "blog", keywordInTitle: true, keywordInH2: false, keywordInMeta: true,
  keywordInSlug: false, keywordDensity: 1.2, wordCount: 800, aiCount: 0, authorityCount: 1, clickbaitCount: 0,
};
const keywords = {
  keywordDensity: 1.2, lsi: { found: ["article"], suggested: ["post", "content"] }, suggestions: ["best blog", "blog tips"],
  keywordInTitle: true, keywordInH2: false, keywordInMeta: true, keywordInSlug: false,
};

describe("ScoreBar", () => {
  it.each([
    ["0 is poor", 0, RED],
    ["39 is poor", 39, RED],
    ["40 is ok", 40, AMBER],
    ["69 is ok", 69, AMBER],
    ["70 is good", 70, GREEN],
    ["100 is good", 100, GREEN],
  ])("%s", (_label, score, color) => {
    render(<ScoreBar score={score} label="Overall" />);
    const value = screen.getByText(`${score}/100`);
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(value).toHaveStyle({ color });
    const fill = value.parentElement?.nextElementSibling?.firstElementChild;
    expect(fill).toHaveStyle({ width: `${score}%`, background: color });
  });
});

describe("Check", () => {
  it.each([
    ["a tick for a pass", true, "✓", GREEN],
    ["a cross for a fail", false, "✗", RED],
  ])("shows %s beside the text", (_label, pass, glyph, color) => {
    render(<Check pass={pass} text="Keyword in title" />);
    expect(mark("Keyword in title")).toBe(glyph);
    expect(screen.getByText(glyph)).toHaveStyle({ color });
  });
});

describe("OverviewTab", () => {
  it("shows both scores and mirrors each keyword-placement flag", () => {
    render(<OverviewTab {...overview} />);
    expect(screen.getByText("Overall SEO Score").nextElementSibling).toHaveTextContent("80/100");
    expect(screen.getByText("Headline Score").nextElementSibling).toHaveTextContent("55/100");
    expect(mark('Keyword "blog" in title')).toBe("✓");
    expect(mark("Keyword in at least one H2")).toBe("✗");
    expect(mark("Keyword in meta description")).toBe("✓");
    expect(mark("Keyword in URL slug")).toBe("✗");
  });

  it("shows a placeholder when no keyword is set", () => {
    render(<OverviewTab {...overview} keyword="" />);
    expect(screen.getByText('Keyword "..." in title')).toBeInTheDocument();
  });

  it.each([
    ["below the window", 0.49, "✗"],
    ["at the minimum", 0.5, "✓"],
    ["at the maximum", 3, "✓"],
    ["above the window", 3.01, "✗"],
  ])("judges keyword density %s", (_label, keywordDensity, glyph) => {
    render(<OverviewTab {...overview} keywordDensity={keywordDensity} />);
    expect(mark(`Keyword density: ${keywordDensity}% (aim for 0.5-3%)`)).toBe(glyph);
  });

  it.each([
    ["299 words fail", { wordCount: 299 }, "Word count: 299 (min 300)", "✗"],
    ["300 words pass", { wordCount: 300 }, "Word count: 300 (min 300)", "✓"],
    ["no AI clichés pass", { aiCount: 0 }, "AI clichés: None found", "✓"],
    ["AI clichés fail with a count", { aiCount: 2 }, "AI clichés: 2 found", "✗"],
    ["no authority links fail", { authorityCount: 0 }, "Authority links: 0 found", "✗"],
    ["one authority link passes", { authorityCount: 1 }, "Authority links: 1 found", "✓"],
    ["a clean headline passes", { clickbaitCount: 0 }, "Clickbait check: Clean", "✓"],
    ["clickbait fails with a count", { clickbaitCount: 3 }, "Clickbait check: 3 warnings", "✗"],
  ])("%s", (_label, override, text, glyph) => {
    render(<OverviewTab {...overview} {...override} />);
    expect(mark(text)).toBe(glyph);
  });
});

describe("KeywordsTab", () => {
  it("lists found and suggested variations, headline suggestions and placement checks", () => {
    render(<KeywordsTab {...keywords} />);
    expect(screen.getByText("Found:").parentElement).toHaveTextContent("Found: article");
    expect(screen.getByText("Consider adding:").parentElement).toHaveTextContent("Consider adding: postcontent");
    expect(screen.getAllByTestId("keyword-suggestion").map((el) => el.textContent)).toEqual(["best blog", "blog tips"]);
    expect([mark("In title"), mark("In H2 heading"), mark("In meta description"), mark("In URL slug")]).toEqual(["✓", "✗", "✓", "✗"]);
  });

  it("omits the found/suggested rows and suggestions when there are none", () => {
    render(<KeywordsTab {...keywords} lsi={{ found: [], suggested: [] }} suggestions={[]} />);
    expect(screen.queryByText("Found:")).not.toBeInTheDocument();
    expect(screen.queryByText("Consider adding:")).not.toBeInTheDocument();
    expect(screen.queryByTestId("keyword-suggestion")).not.toBeInTheDocument();
  });

  it.each([
    ["in the window", 1.2, GREEN],
    ["too low", 0.1, RED],
    ["too high", 4.5, RED],
  ])("colours the current density when it is %s", (_label, keywordDensity, color) => {
    render(<KeywordsTab {...keywords} keywordDensity={keywordDensity} />);
    expect(screen.getByText(`${keywordDensity}%`)).toHaveStyle({ color });
  });
});

describe("ContentTab", () => {
  it("reports a clean article", () => {
    render(<ContentTab aiCliches={[]} clickbaits={[]} wordCount={800} />);
    expect(screen.getByText("✓ No AI clichés detected")).toBeInTheDocument();
    expect(screen.getByText("✓ Headline is not clickbait-y")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-cliche")).not.toBeInTheDocument();
  });

  it("lists each AI cliché in quotes and each clickbait pattern", () => {
    render(<ContentTab aiCliches={["delve", "deep dive"]} clickbaits={["shocking"]} wordCount={800} />);
    expect(screen.getByText("✗ Found 2 AI clichés (remove before publishing):")).toBeInTheDocument();
    expect(screen.getAllByTestId("ai-cliche").map((el) => el.textContent)).toEqual(['"delve"', '"deep dive"']);
    expect(screen.getByText("⚠ Clickbait patterns detected:")).toBeInTheDocument();
    expect(screen.getByText("shocking")).toBeInTheDocument();
  });

  it.each([
    ["299 words: too short", 299, "✗", "✓"],
    ["300 words: long enough", 300, "✓", "✓"],
    ["5000 words: at the limit", 5000, "✓", "✓"],
    ["5001 words: too long", 5001, "✓", "✗"],
  ])("%s", (_label, wordCount, minGlyph, maxGlyph) => {
    render(<ContentTab aiCliches={[]} clickbaits={[]} wordCount={wordCount} />);
    expect(mark(`${wordCount} words (min 300 for SEO)`)).toBe(minGlyph);
    expect(mark("Under 5000 word limit")).toBe(maxGlyph);
  });
});

describe("LinksTab", () => {
  it.each([
    ["no links", [], [], "✗", "✗"],
    ["one ordinary link", ["https://a.example"], [], "✗", "✗"],
    ["two links, one authoritative", ["https://a.example", "https://en.wikipedia.org/wiki/X"], ["https://en.wikipedia.org/wiki/X"], "✓", "✓"],
  ])("checks link counts for %s", (_label, external, authority, externalGlyph, authorityGlyph) => {
    render(<LinksTab external={external} authority={authority} />);
    expect(screen.getByText(`External Links (${external.length})`)).toBeInTheDocument();
    expect(mark(`At least 2 external links (found ${external.length})`)).toBe(externalGlyph);
    expect(mark(`At least 1 high-authority link (found ${authority.length})`)).toBe(authorityGlyph);
  });

  it("stars high-authority URLs, rings the rest and truncates long URLs to 60 characters", () => {
    const long = `https://blog.example/${"a".repeat(80)}`;
    render(<LinksTab external={["https://en.wikipedia.org/wiki/X", long]} authority={["https://en.wikipedia.org/wiki/X"]} />);
    expect(screen.getByText("https://en.wikipedia.org/wiki/X").previousElementSibling).toHaveTextContent("★");
    expect(screen.getByText(long.slice(0, 60)).previousElementSibling).toHaveTextContent("○");
    expect(screen.queryByText(long)).not.toBeInTheDocument();
  });
});

describe("ImagesTab", () => {
  it.each([
    ["no images", { total: 0, missing: [], withKeyword: [] }, "0 image(s) found", "✗", "All images have alt text", "✓"],
    ["all described", { total: 2, missing: [], withKeyword: ["a.png"] }, "2 image(s) found", "✓", "All images have alt text", "✓"],
    ["one undescribed", { total: 2, missing: ["b.png"], withKeyword: [] }, "2 image(s) found", "✓", "1 missing alt text", "✗"],
  ])("summarises %s", (_label, check, totalText, totalGlyph, altText, altGlyph) => {
    render(<ImagesTab check={check} keyword="" />);
    expect(mark(totalText)).toBe(totalGlyph);
    expect(mark(altText)).toBe(altGlyph);
    expect(screen.queryByText(/with keyword in alt text/)).not.toBeInTheDocument();
  });

  it.each([
    ["passes when an image alt has the keyword", ["a.png"], "✓"],
    ["fails when none has", [], "✗"],
  ])("with a keyword set, %s", (_label, withKeyword, glyph) => {
    render(<ImagesTab check={{ total: 1, missing: [], withKeyword }} keyword="blog" />);
    expect(mark(`${withKeyword.length} image(s) with keyword in alt text`)).toBe(glyph);
  });
});

describe("OpenGraphTab", () => {
  it.each([
    ["70 characters fits", 70, "✓"],
    ["71 characters is too long", 71, "✗"],
  ])("og:title of %s", (_label, length, glyph) => {
    render(<OpenGraphTab title={"t".repeat(length)} description="d" image="" keyword="" />);
    expect(mark(`og:title length ≤ 70 chars (${length})`)).toBe(glyph);
    expect(mark("Title fits Twitter limit")).toBe(glyph);
  });

  it.each([
    ["200 characters fits", 200, "✓"],
    ["201 characters is too long", 201, "✗"],
  ])("og:description of %s", (_label, length, glyph) => {
    render(<OpenGraphTab title="t" description={"d".repeat(length)} image="" keyword="" />);
    expect(mark("og:description length ≤ 200 chars")).toBe(glyph);
    expect(mark("Description fits Twitter limit")).toBe(glyph);
  });

  it.each([
    ["everything set", { title: "My Blog Guide", description: "About it", image: "/a.png", keyword: "blog" }, ["✓", "✓", "✓", "✓"], "summary_large_image"],
    ["nothing set", { title: "", description: "", image: "", keyword: "blog" }, ["✗", "✗", "✗", "✗"], "summary"],
  ])("with %s", (_label, props, glyphs, card) => {
    render(<OpenGraphTab {...props} />);
    expect([
      mark(`og:title set (${props.title.length} chars)`), mark(`og:description set (${props.description.length} chars)`),
      mark("og:image set"), mark("Keyword in og:title"),
    ]).toEqual(glyphs);
    expect(mark(`Card type: ${card}`)).toBe(glyphs[2]);
  });

  it("hides the keyword check when no keyword is set", () => {
    render(<OpenGraphTab title="My Blog" description="d" image="" keyword="" />);
    expect(screen.queryByText("Keyword in og:title")).not.toBeInTheDocument();
  });
});
