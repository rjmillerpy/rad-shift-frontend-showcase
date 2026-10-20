import {
  deriveCollisionFromGround,
  fillRect,
  finalizeLayers,
  makeCollisionGrid,
  makeGrid,
  setTile,
  stampDiagonalRoad,
} from "@/app/amble/data/maps/mapBuilder";
import { TILE_IDS } from "@/app/amble/data/tileset";

describe("makeGrid", () => {
  it("allocates a width × height grid pre-filled with the initial value", () => {
    const grid = makeGrid(3, 2, TILE_IDS.GRASS);
    expect(grid).toEqual([
      [TILE_IDS.GRASS, TILE_IDS.GRASS, TILE_IDS.GRASS],
      [TILE_IDS.GRASS, TILE_IDS.GRASS, TILE_IDS.GRASS],
    ]);
  });
});

describe("makeCollisionGrid", () => {
  it("defaults every cell to 0 (walkable)", () => {
    const grid = makeCollisionGrid(2, 2);
    expect(grid).toEqual([[0, 0], [0, 0]]);
  });
});

describe("fillRect", () => {
  it("fills the inclusive rectangle", () => {
    const grid = makeGrid(4, 3, TILE_IDS.GRASS);
    fillRect(grid, 1, 1, 2, 2, TILE_IDS.ROAD);
    expect(grid[0]).toEqual([TILE_IDS.GRASS, TILE_IDS.GRASS, TILE_IDS.GRASS, TILE_IDS.GRASS]);
    expect(grid[1]).toEqual([TILE_IDS.GRASS, TILE_IDS.ROAD, TILE_IDS.ROAD, TILE_IDS.GRASS]);
    expect(grid[2]).toEqual([TILE_IDS.GRASS, TILE_IDS.ROAD, TILE_IDS.ROAD, TILE_IDS.GRASS]);
  });

  it("normalizes reversed corner order", () => {
    const grid = makeGrid(3, 3, TILE_IDS.GRASS);
    fillRect(grid, 2, 2, 1, 1, TILE_IDS.SIDEWALK);
    expect(grid[1][1]).toBe(TILE_IDS.SIDEWALK);
    expect(grid[2][2]).toBe(TILE_IDS.SIDEWALK);
  });

  it("clips out-of-bounds regions without throwing", () => {
    const grid = makeGrid(3, 3, TILE_IDS.GRASS);
    expect(() => fillRect(grid, -5, -5, 10, 10, TILE_IDS.ROAD)).not.toThrow();
    for (const row of grid) for (const cell of row) expect(cell).toBe(TILE_IDS.ROAD);
  });
});

describe("setTile", () => {
  it("writes an in-range cell", () => {
    const grid = makeGrid(3, 3, TILE_IDS.GRASS);
    setTile(grid, 1, 1, TILE_IDS.SIDEWALK);
    expect(grid[1][1]).toBe(TILE_IDS.SIDEWALK);
  });

  it.each<[string, number, number]>([
    ["negative x", -1, 0],
    ["negative y", 0, -1],
    ["x out",       3, 0],
    ["y out",       0, 3],
  ])("no-ops on %s", (_name, x, y) => {
    const grid = makeGrid(3, 3, TILE_IDS.GRASS);
    expect(() => setTile(grid, x, y, TILE_IDS.ROAD)).not.toThrow();
  });
});

describe("deriveCollisionFromGround", () => {
  it("marks blocked tile ids as 1 and everything else as 0", () => {
    const ground = [
      [TILE_IDS.GRASS, TILE_IDS.BUILDING_COMMERCIAL],
      [TILE_IDS.WATER, TILE_IDS.SIDEWALK],
    ];
    expect(deriveCollisionFromGround(ground)).toEqual([[0, 1], [1, 0]]);
  });
});

describe("stampDiagonalRoad", () => {
  it("draws a continuous 2-tile-thick line hitting both endpoints", () => {
    const grid = makeGrid(10, 10, TILE_IDS.GRASS);
    stampDiagonalRoad(grid, 1, 1, 8, 5, TILE_IDS.ROAD, 2);
    expect(grid[1][1]).toBe(TILE_IDS.ROAD);
    expect(grid[5][8]).toBe(TILE_IDS.ROAD);
    // Some interior cell along the line is painted
    expect(grid[3][4]).toBe(TILE_IDS.ROAD);
  });

  it("draws a 1-tile brush when thickness=1", () => {
    const grid = makeGrid(6, 6, TILE_IDS.GRASS);
    stampDiagonalRoad(grid, 0, 0, 3, 3, TILE_IDS.ROAD, 1);
    expect(grid[0][0]).toBe(TILE_IDS.ROAD);
    expect(grid[3][3]).toBe(TILE_IDS.ROAD);
    expect(grid[0][3]).toBe(TILE_IDS.GRASS);
  });

  it("handles reversed endpoints (SE → NW)", () => {
    const grid = makeGrid(10, 10, TILE_IDS.GRASS);
    stampDiagonalRoad(grid, 8, 8, 1, 1, TILE_IDS.ROAD, 1);
    expect(grid[8][8]).toBe(TILE_IDS.ROAD);
    expect(grid[1][1]).toBe(TILE_IDS.ROAD);
  });

  it("clips at grid edges without throwing", () => {
    const grid = makeGrid(5, 5, TILE_IDS.GRASS);
    expect(() => stampDiagonalRoad(grid, -3, -3, 10, 10, TILE_IDS.ROAD, 2)).not.toThrow();
    expect(grid[4][4]).toBe(TILE_IDS.ROAD);
  });

  it("is a no-op when thickness < 1", () => {
    const grid = makeGrid(5, 5, TILE_IDS.GRASS);
    stampDiagonalRoad(grid, 0, 0, 4, 4, TILE_IDS.ROAD, 0);
    expect(grid[0][0]).toBe(TILE_IDS.GRASS);
    expect(grid[4][4]).toBe(TILE_IDS.GRASS);
  });
});

describe("finalizeLayers", () => {
  it("returns fresh row copies (rule 12)", () => {
    const ground = makeGrid(2, 2, TILE_IDS.GRASS);
    const collision = makeCollisionGrid(2, 2);
    const layers = finalizeLayers(ground, collision);
    expect(layers.ground[0]).not.toBe(ground[0]);
    expect(layers.collision[0]).not.toBe(collision[0]);
    expect(layers.decoration).toBeUndefined();
  });
});
