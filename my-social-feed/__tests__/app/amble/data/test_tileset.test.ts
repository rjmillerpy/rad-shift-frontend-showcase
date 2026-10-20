import {
  BLOCKED_TILE_IDS,
  TILE_COLORS,
  TILE_IDS,
  TILE_SIZE_PX,
} from "@/app/amble/data/tileset";

describe("TILE_IDS", () => {
  it("assigns unique ids to every tile kind", () => {
    const values = Object.values(TILE_IDS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("TILE_COLORS", () => {
  it.each(Object.values(TILE_IDS))("tile %i has a valid hex color", (tileId) => {
    expect(TILE_COLORS[tileId as keyof typeof TILE_COLORS]).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("BLOCKED_TILE_IDS", () => {
  it("blocks the physical structures", () => {
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.BUILDING_COMMERCIAL)).toBe(true);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.BUILDING_RESIDENTIAL)).toBe(true);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.WATER)).toBe(true);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.FENCE)).toBe(true);
  });

  it("does NOT block ground the user should be able to walk on", () => {
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.GRASS)).toBe(false);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.SIDEWALK)).toBe(false);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.ROAD)).toBe(false);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.CROSSWALK)).toBe(false);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.PARK_PATH)).toBe(false);
    expect(BLOCKED_TILE_IDS.has(TILE_IDS.TRAIN_PLATFORM)).toBe(false);
  });
});

describe("TILE_SIZE_PX", () => {
  it("is a positive power-friendly integer", () => {
    expect(TILE_SIZE_PX).toBeGreaterThan(0);
    expect(Number.isInteger(TILE_SIZE_PX)).toBe(true);
  });
});
