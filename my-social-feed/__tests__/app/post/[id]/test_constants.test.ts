import {
  HEX_AVATAR_CLIP,
  QUOTED_TEXT_PREVIEW_CHARS,
  REPLY_TREE_MAX_DEPTH,
} from "@/app/post/[id]/constants";

describe("HEX_AVATAR_CLIP", () => {
  const match = /^polygon\((.+)\)$/.exec(HEX_AVATAR_CLIP);
  const points = (match?.[1] ?? "").split(",").map((p) => p.trim());

  it("is a CSS polygon() with enough vertices to enclose an area", () => {
    expect(match).not.toBeNull();
    expect(points.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps every vertex inside the avatar box, as x% y% pairs", () => {
    for (const point of points) {
      const pair = /^(\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/.exec(point);
      expect(pair).not.toBeNull();
      for (const coord of [Number(pair![1]), Number(pair![2])]) {
        expect(coord).toBeGreaterThanOrEqual(0);
        expect(coord).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("post detail limits", () => {
  test.each([
    ["QUOTED_TEXT_PREVIEW_CHARS", QUOTED_TEXT_PREVIEW_CHARS],
    ["REPLY_TREE_MAX_DEPTH", REPLY_TREE_MAX_DEPTH],
  ])("%s is a positive whole number", (_name, value) => {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
  });

  it("keeps the quote preview to a short excerpt rather than the whole post", () => {
    expect(QUOTED_TEXT_PREVIEW_CHARS).toBeGreaterThanOrEqual(20);
    expect(QUOTED_TEXT_PREVIEW_CHARS).toBeLessThanOrEqual(280);
  });

  it("bounds the automatic reply fetch so a deep thread cannot fan out without limit", () => {
    expect(REPLY_TREE_MAX_DEPTH).toBeLessThanOrEqual(10);
  });
});
