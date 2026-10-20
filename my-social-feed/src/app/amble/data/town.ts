/**
 * The demo town: what the public build walks around in. Two streets crossing,
 * a two-floor café you can enter, a pond, and four content anchors whose entity ids
 * match the backend's demo bindings (app/amble/content/demo-bindings.yaml).
 * Built from the same helpers as any map, so every engine path (collision,
 * interiors, dialogue, roaming NPCs) runs on it.
 */
import type { InteriorMap, MapManifest } from "./schema";
import { TILE_IDS, TILE_SIZE_PX } from "./tileset";
import { deriveCollisionFromGround, fillRect, finalizeLayers, makeGrid } from "./maps/mapBuilder";
import { assembleInterior, walledRoom } from "./maps/interiors/interiorBuilder";
import { interiorsById, type StubPost, type Town } from "./townTypes";

const WIDTH = 40;
const HEIGHT = 30;
// The crossing streets: 2-tile roads with a sidewalk either side.
const MAIN_ST_ROWS = [14, 15] as const;
const CROSS_ST_COLS = [19, 20] as const;
const CAFE = { x1: 24, y1: 6, x2: 31, y2: 11, doorX: 27 } as const;
const POND = { x1: 6, y1: 21, x2: 11, y2: 25 } as const;
const CAFE_INTERIOR_ID = "demo-cafe-interior";
// Upper floors are named `<ground id>-2f`; the stairs share one tile on both floors.
const CAFE_LOFT_ID = `${CAFE_INTERIOR_ID}-2f`;
const CAFE_ROOM = { width: 10, height: 7 } as const;
const CAFE_STAIRS = { tileX: 8, tileY: 4 } as const;

function buildMap(): MapManifest {
  const ground = makeGrid(WIDTH, HEIGHT, TILE_IDS.GRASS);
  const [mainTop, mainBottom] = MAIN_ST_ROWS;
  const [crossLeft, crossRight] = CROSS_ST_COLS;
  fillRect(ground, 0, mainTop - 1, WIDTH - 1, mainBottom + 1, TILE_IDS.SIDEWALK);
  fillRect(ground, crossLeft - 1, 0, crossRight + 1, HEIGHT - 1, TILE_IDS.SIDEWALK);
  fillRect(ground, 0, mainTop, WIDTH - 1, mainBottom, TILE_IDS.ROAD);
  fillRect(ground, crossLeft, 0, crossRight, HEIGHT - 1, TILE_IDS.ROAD);
  fillRect(ground, CAFE.x1, CAFE.y1, CAFE.x2, CAFE.y2, TILE_IDS.BUILDING_COMMERCIAL);
  // Café forecourt: sidewalk from its door down to Main St.
  fillRect(ground, CAFE.doorX, CAFE.y2 + 1, CAFE.doorX, mainTop - 1, TILE_IDS.SIDEWALK);
  fillRect(ground, POND.x1, POND.y1, POND.x2, POND.y2, TILE_IDS.WATER);

  return {
    id: "demo-town",
    width: WIDTH,
    height: HEIGHT,
    tileWidth: TILE_SIZE_PX,
    tileHeight: TILE_SIZE_PX,
    tilesetRefs: [],
    cameraBounds: { x: 0, y: 0, width: WIDTH * TILE_SIZE_PX, height: HEIGHT * TILE_SIZE_PX },
    layers: finalizeLayers(ground, deriveCollisionFromGround(ground)),
    entities: [
      { id: "wanderer", type: "npc", position: { tileX: 9, tileY: 9 }, facingHint: "south" },
      { id: "welcome-sign", type: "sign", position: { tileX: 17, tileY: 12 } },
      { id: "noticeboard", type: "sign", position: { tileX: 23, tileY: 17 } },
      { id: "building-cafe", type: "building", position: { tileX: CAFE.doorX, tileY: CAFE.y2 }, interiorMapId: CAFE_INTERIOR_ID },
    ],
  };
}

function buildCafe(): InteriorMap {
  const exit = { tileX: 5, tileY: CAFE_ROOM.height - 1 };
  const ground = walledRoom(CAFE_ROOM.width, CAFE_ROOM.height);
  fillRect(ground, 2, 1, 7, 1, TILE_IDS.FENCE); // counter along the back wall
  ground[exit.tileY][exit.tileX] = TILE_IDS.SIDEWALK;
  return assembleInterior(ground, {
    id: CAFE_INTERIOR_ID,
    entities: [{ id: "cafe-owner", type: "npc", position: { tileX: 5, tileY: 2 } }],
    staircases: [{ ...CAFE_STAIRS, targetMapId: CAFE_LOFT_ID, targetTileX: CAFE_STAIRS.tileX, targetTileY: CAFE_STAIRS.tileY, targetFacing: "west", label: "Upstairs" }],
    exitTile: exit,
    entryFacing: "north",
  });
}

function buildCafeLoft(): InteriorMap {
  const ground = walledRoom(CAFE_ROOM.width, CAFE_ROOM.height);
  return assembleInterior(ground, {
    id: CAFE_LOFT_ID,
    entities: [{ id: "cafe-loft-window", type: "object", position: { tileX: 3, tileY: 1 } }],
    staircases: [{ ...CAFE_STAIRS, targetMapId: CAFE_INTERIOR_ID, targetTileX: CAFE_STAIRS.tileX, targetTileY: CAFE_STAIRS.tileY, targetFacing: "west", label: "Downstairs" }],
    // Upper floors use their down-staircase as the exit tile, so E never leaves from upstairs.
    exitTile: CAFE_STAIRS,
    entryFacing: "west",
  });
}

const STUB_POSTS: Record<string, ReadonlyArray<StubPost>> = {
  wanderer: [
    { author: "demo.walker", text: "Took the long way round the pond today.", unix_timestamp: 1_700_000_100 },
    { author: "demo.walker", text: "Someone planted tulips by the crossing.", unix_timestamp: 1_700_000_200 },
  ],
  "welcome-sign": [
    { author: "town.hall", text: "Welcome! Walk up to anything and press E.", unix_timestamp: 1_700_000_300 },
  ],
  noticeboard: [
    { author: "town.hall", text: "Open mic at the café on Friday.", unix_timestamp: 1_700_000_400 },
    { author: "town.hall", text: "Street sweeping on Main St, Tuesday morning.", unix_timestamp: 1_700_000_500 },
  ],
  "cafe-owner": [
    { author: "demo.cafe", text: "Fresh scones until they run out.", unix_timestamp: 1_700_000_600 },
  ],
};

export const TOWN: Town = {
  map: buildMap(),
  // The grass round the pond, south-west of the crossing.
  parkBounds: { minCol: 2, maxCol: 15, minRow: 18, maxRow: 28 },
  interiors: interiorsById([buildCafe(), buildCafeLoft()]),
  stubPosts: STUB_POSTS,
};
