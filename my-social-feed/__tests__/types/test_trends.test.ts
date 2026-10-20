import type { SourceTrends, TrendItem, TrendsResponse } from "@/types/trends";

// `src/types/trends.ts` exports only types, so the fixtures exist for `tsc` to check the shapes.
const item = (rank: number, keyword: string, extra: Partial<TrendItem> = {}): TrendItem => ({
  source: "google", rank, keyword, url: null, volume: null, category: null, ...extra,
});

const google: SourceTrends = {
  source: "google",
  label: "Google Trends",
  items: [item(1, "next.js 15", { url: "https://trends.google.com/x", volume: "200K+", category: "tech" }), item(2, "jest")],
  fetched_at: 1759622400,
  error: null,
};

const failed: SourceTrends = { source: "reddit", label: "Reddit", items: [], fetched_at: 1759622400, error: "upstream timeout" };

const response: TrendsResponse = { sources: [google, failed] };

describe("TrendItem", () => {
  it("requires every field but lets url, volume and category be null", () => {
    const bare = item(2, "jest");
    expect(Object.keys(bare).sort()).toEqual(["category", "keyword", "rank", "source", "url", "volume"]);
    expect([bare.url, bare.volume, bare.category]).toEqual([null, null, null]);
  });

  it("keeps volume as display text rather than a number", () => {
    expect(google.items[0].volume).toBe("200K+");
  });
});

describe("SourceTrends", () => {
  it.each<[string, SourceTrends, number, boolean]>([
    ["a healthy source", google, 2, false],
    ["a failed source", failed, 0, true],
  ])("%s carries its items and error state", (_label, source, count, hasError) => {
    expect(source.items).toHaveLength(count);
    expect(source.error !== null).toBe(hasError);
    expect(source.items.every((trend) => trend.source === source.source)).toBe(true);
  });

  it("ranks items from 1 upwards in order", () => {
    expect(google.items.map((trend) => trend.rank)).toEqual([1, 2]);
  });

  it("records when it was fetched in unix seconds", () => {
    expect(new Date(google.fetched_at * 1000).getUTCFullYear()).toBe(2025);
  });
});

describe("TrendsResponse", () => {
  it("round-trips through JSON as the API sends it, keeping failed sources alongside healthy ones", () => {
    const parsed: TrendsResponse = JSON.parse(JSON.stringify(response));
    expect(parsed).toEqual(response);
    expect(parsed.sources.map((s) => s.source)).toEqual(["google", "reddit"]);
    expect(parsed.sources.filter((s) => s.error === null).flatMap((s) => s.items)).toHaveLength(2);
  });
});
