import { HEX_AVATAR_CLIP, SHARE_ANIMATION_MS } from "@/app/lame/constants";

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

  it("touches all four edges so the avatar is not shrunk by the clip", () => {
    const xs = points.map((p) => parseFloat(p.split(" ")[0]));
    const ys = points.map((p) => parseFloat(p.split(" ")[1]));
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(100);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(100);
  });
});

describe("SHARE_ANIMATION_MS", () => {
  it("is a positive whole number of milliseconds, short enough to read as a flash", () => {
    expect(Number.isInteger(SHARE_ANIMATION_MS)).toBe(true);
    expect(SHARE_ANIMATION_MS).toBeGreaterThan(0);
    expect(SHARE_ANIMATION_MS).toBeLessThanOrEqual(2000);
  });
});
