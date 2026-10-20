import {
  AMBLE_FEED_KEY,
  AMBLE_ROUTE,
  API_RETRY_BASE_MS,
  API_RETRY_COUNT,
  API_TIMEOUT_MS,
  AVATAR_SPEED_PX_PER_S,
  MS_PER_SECOND,
  PHASER_HEIGHT_PX,
  PHASER_WIDTH_PX,
  PLACEHOLDER_TILE_SIZE_PX,
  SCENE_KEYS,
} from "@/app/amble/data/constants";

describe("SCENE_KEYS", () => {
  it("exposes exactly boot + amble + amble-interior", () => {
    expect(Object.values(SCENE_KEYS).sort()).toEqual(["amble", "amble-interior", "boot"]);
  });

  it("has unique values", () => {
    const values = Object.values(SCENE_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("canvas geometry", () => {
  it.each<[string, number]>([
    ["PHASER_WIDTH_PX", PHASER_WIDTH_PX],
    ["PHASER_HEIGHT_PX", PHASER_HEIGHT_PX],
    ["PLACEHOLDER_TILE_SIZE_PX", PLACEHOLDER_TILE_SIZE_PX],
    ["AVATAR_SPEED_PX_PER_S", AVATAR_SPEED_PX_PER_S],
    ["MS_PER_SECOND", MS_PER_SECOND],
  ])("%s is a positive number", (_name, value) => {
    expect(value).toBeGreaterThan(0);
    expect(Number.isFinite(value)).toBe(true);
  });
});

describe("HTTP client bounds", () => {
  it.each<[string, number, number]>([
    ["API_TIMEOUT_MS", API_TIMEOUT_MS, 1000],
    ["API_RETRY_BASE_MS", API_RETRY_BASE_MS, 1],
  ])("%s is at least %i", (_name, value, min) => {
    expect(value).toBeGreaterThanOrEqual(min);
  });

  it("API_RETRY_COUNT is a small non-negative integer", () => {
    expect(API_RETRY_COUNT).toBeGreaterThanOrEqual(0);
    expect(API_RETRY_COUNT).toBeLessThan(10);
    expect(Number.isInteger(API_RETRY_COUNT)).toBe(true);
  });
});

describe("routing", () => {
  it("feed key and route stay in sync", () => {
    expect(AMBLE_ROUTE).toBe(`/${AMBLE_FEED_KEY}`);
  });
});
