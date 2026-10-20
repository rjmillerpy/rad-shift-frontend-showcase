import { assembleInterior, walledRoom } from "@/app/amble/data/maps/interiors/interiorBuilder";
import { TILE_IDS, TILE_SIZE_PX } from "@/app/amble/data/tileset";

describe("walledRoom", () => {
  const room = walledRoom(5, 4);

  it("has the requested size", () => {
    expect(room).toHaveLength(4);
    expect(room.every((row) => row.length === 5)).toBe(true);
  });

  it("is walled all round and floored inside", () => {
    const edge = (x: number, y: number) => x === 0 || y === 0 || x === 4 || y === 3;
    room.forEach((row, y) =>
      row.forEach((tile, x) =>
        expect(tile).toBe(edge(x, y) ? TILE_IDS.BUILDING_RESIDENTIAL : TILE_IDS.SIDEWALK),
      ),
    );
  });

  it("takes other floor and wall tiles", () => {
    const station = walledRoom(3, 3, { floor: TILE_IDS.TRAIN_PLATFORM, wall: TILE_IDS.BUILDING_MUNICIPAL });
    expect(station[1][1]).toBe(TILE_IDS.TRAIN_PLATFORM);
    expect(station[0][0]).toBe(TILE_IDS.BUILDING_MUNICIPAL);
  });
});

describe("assembleInterior", () => {
  const ground = walledRoom(6, 4);
  const map = assembleInterior(ground, {
    id: "test-interior",
    entities: [],
    staircases: [],
    exitTile: { tileX: 3, tileY: 3 },
    entryFacing: "north",
  });

  it("takes its size from the grid", () => {
    expect([map.width, map.height]).toEqual([6, 4]);
    expect([map.tileWidth, map.tileHeight]).toEqual([TILE_SIZE_PX, TILE_SIZE_PX]);
  });

  it("bounds the camera to the whole room", () => {
    expect(map.cameraBounds).toEqual({ x: 0, y: 0, width: 6 * TILE_SIZE_PX, height: 4 * TILE_SIZE_PX });
  });

  it("derives collision from the ground: walls block, floor doesn't", () => {
    expect(map.layers.collision[0][0]).toBeTruthy();
    expect(map.layers.collision[1][1]).toBeFalsy();
  });

  it("keeps the details it was given", () => {
    expect(map.id).toBe("test-interior");
    expect(map.exitTile).toEqual({ tileX: 3, tileY: 3 });
  });
});
