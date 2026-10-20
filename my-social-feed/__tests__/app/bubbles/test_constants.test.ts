import {
  BUBBLE_SEED,
  CAROUSEL_ROTATE_MS,
  COOLDOWN_MS,
  CUSTOM_TOPIC_COLORS,
  DEEP_READ_HOVER_MS,
  FEED_TOPICS,
  GENERAL_TOPICS,
  HEX_AVATAR_CLIP,
  MICRO_KEYWORDS,
  NAV_TRANSITION_MS,
  POST_PAGE_SIZE,
  PROFILE_BUBBLE_SIZE,
  VIEW_SCALE_REF_PX,
} from "@/app/bubbles/constants";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe("bubbles constants — topics", () => {
  it("defines the two feed topics, each flagged as a feed with its own tab", () => {
    expect(FEED_TOPICS.map((t) => t.label)).toEqual(["Algo", "Following"]);
    expect(FEED_TOPICS.map((t) => t.tab)).toEqual(["algo", "following"]);
    expect(FEED_TOPICS.every((t) => t.isFeed === true)).toBe(true);
  });

  it("has 18 general topics with unique labels that don't clash with feed topics", () => {
    const labels = GENERAL_TOPICS.map((t) => t.label.toLowerCase());
    expect(labels).toHaveLength(18);
    expect(new Set(labels).size).toBe(labels.length);
    for (const feed of FEED_TOPICS) expect(labels).not.toContain(feed.label.toLowerCase());
  });

  it.each([
    ["feed topics", FEED_TOPICS.map((t) => t.color)],
    ["general topics", GENERAL_TOPICS.map((t) => t.color)],
    ["custom topic palette", CUSTOM_TOPIC_COLORS],
  ])("%s use 6-digit hex colours", (_name, colors) => {
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) expect(c).toMatch(HEX_COLOR);
  });

  it("custom topic palette has no repeated colours", () => {
    expect(new Set(CUSTOM_TOPIC_COLORS).size).toBe(CUSTOM_TOPIC_COLORS.length);
  });
});

describe("bubbles constants — micro keywords", () => {
  it.each(GENERAL_TOPICS.map((t) => t.label))(
    "%s has at least 3 unique, non-empty micro keywords under its lowercase key",
    (label) => {
      const micros = MICRO_KEYWORDS[label.toLowerCase()];
      expect(micros).toBeDefined();
      expect(micros.length).toBeGreaterThanOrEqual(3);
      expect(new Set(micros).size).toBe(micros.length);
      expect(micros.every((m) => m.trim().length > 0)).toBe(true);
    },
  );

  it("has no micro keyword group for a topic that doesn't exist", () => {
    const known = new Set(GENERAL_TOPICS.map((t) => t.label.toLowerCase()));
    expect(Object.keys(MICRO_KEYWORDS).filter((k) => !known.has(k))).toEqual([]);
  });
});

describe("bubbles constants — timing and sizing", () => {
  it.each([
    ["COOLDOWN_MS", COOLDOWN_MS],
    ["PROFILE_BUBBLE_SIZE", PROFILE_BUBBLE_SIZE],
    ["POST_PAGE_SIZE", POST_PAGE_SIZE],
    ["NAV_TRANSITION_MS", NAV_TRANSITION_MS],
    ["CAROUSEL_ROTATE_MS", CAROUSEL_ROTATE_MS],
    ["DEEP_READ_HOVER_MS", DEEP_READ_HOVER_MS],
    ["BUBBLE_SEED", BUBBLE_SEED],
    ["VIEW_SCALE_REF_PX", VIEW_SCALE_REF_PX],
  ])("%s is a positive integer", (_name, value) => {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
  });

  it("orders the timings: transition < cooldown < carousel rotation < deep-read hover", () => {
    expect(NAV_TRANSITION_MS).toBeLessThan(COOLDOWN_MS);
    expect(COOLDOWN_MS).toBeLessThan(CAROUSEL_ROTATE_MS);
    expect(CAROUSEL_ROTATE_MS).toBeLessThan(DEEP_READ_HOVER_MS);
  });

  it("keeps the profile bubble smaller than the reference viewport", () => {
    expect(PROFILE_BUBBLE_SIZE).toBeLessThan(VIEW_SCALE_REF_PX);
  });
});

describe("bubbles constants — style tokens", () => {
  it("HEX_AVATAR_CLIP is a 7-point polygon of percentage pairs within 0-100%", () => {
    const match = HEX_AVATAR_CLIP.match(/^polygon\((.+)\)$/);
    expect(match).not.toBeNull();
    const points = match![1].split(",").map((p) => p.trim());
    expect(points).toHaveLength(7);
    for (const point of points) {
      expect(point).toMatch(/^\d+% \d+%$/);
      for (const n of point.split(" ").map((v) => parseInt(v, 10))) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      }
    }
  });
});
