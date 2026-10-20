import {
  isAvatarBoxBlocked,
  isTileBlocked,
  isWorldPointBlocked,
  worldToTileX,
  worldToTileY,
} from "@/app/amble/systems/collision";
import type { MapManifest } from "@/app/amble/data/schema";

// 3×3 map. Blocked tile in the middle: (1, 1).
const MAP: MapManifest = {
  id: "test",
  width: 3,
  height: 3,
  tileWidth: 10,
  tileHeight: 10,
  tilesetRefs: [],
  cameraBounds: { x: 0, y: 0, width: 30, height: 30 },
  layers: {
    ground: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    collision: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
  },
  entities: [],
};

describe("isTileBlocked", () => {
  it.each<[string, number, number, boolean]>([
    ["walkable center row",  0, 0, false],
    ["blocked middle tile",  1, 1, true],
    ["out of bounds -1,0",  -1, 0, true],
    ["out of bounds 0,-1",   0, -1, true],
    ["out of bounds max+", 100, 0, true],
    ["out of bounds ,max+", 0, 100, true],
  ])("%s", (_name, x, y, expected) => {
    expect(isTileBlocked(MAP, x, y)).toBe(expected);
  });
});

describe("worldToTile{X,Y}", () => {
  it.each<[number, number, number]>([
    [0, 10, 0],
    [9, 10, 0],
    [10, 10, 1],
    [25, 10, 2],
    [-1, 10, -1],
  ])("worldToTileX(%i, %i) → %i", (v, tile, expected) => {
    expect(worldToTileX(v, tile)).toBe(expected);
    expect(worldToTileY(v, tile)).toBe(expected);
  });
});

describe("isWorldPointBlocked", () => {
  it("blocks a point inside the middle tile", () => {
    expect(isWorldPointBlocked(MAP, 15, 15)).toBe(true);
  });
  it("walks a point on the border of a non-blocked tile", () => {
    expect(isWorldPointBlocked(MAP, 0, 0)).toBe(false);
    expect(isWorldPointBlocked(MAP, 25, 25)).toBe(false);
  });
  it("treats out-of-map points as blocked", () => {
    expect(isWorldPointBlocked(MAP, -1, 0)).toBe(true);
    expect(isWorldPointBlocked(MAP, 0, -1)).toBe(true);
    expect(isWorldPointBlocked(MAP, 999, 0)).toBe(true);
  });
});

describe("isAvatarBoxBlocked", () => {
  it("clears when the box sits entirely within a walkable tile", () => {
    expect(isAvatarBoxBlocked(MAP, 5, 5, 3)).toBe(false);
  });

  it("blocks when the box overlaps the middle blocked tile", () => {
    expect(isAvatarBoxBlocked(MAP, 15, 15, 3)).toBe(true);
  });

  it("blocks when only one corner clips the blocked tile", () => {
    // Box centred just outside the blocked tile but overlapping by one pixel.
    expect(isAvatarBoxBlocked(MAP, 12, 12, 3)).toBe(true);
  });

  it("blocks at the map edge", () => {
    expect(isAvatarBoxBlocked(MAP, 0, 0, 2)).toBe(true);
  });
});
