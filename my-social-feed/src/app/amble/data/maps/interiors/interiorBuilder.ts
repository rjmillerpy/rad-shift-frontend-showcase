/**
 * What every building interior is built from: a floored room inside a wall
 * perimeter, and the InteriorMap scaffolding around the finished ground
 * grid. Each interior file then only says what's different about it: its
 * furniture, entities, exit and stairs.
 */
import { TILE_IDS, TILE_SIZE_PX, type TileId } from "../../tileset";
import type { InteriorMap } from "../../schema";
import { deriveCollisionFromGround, fillRect, finalizeLayers, makeGrid, type MutableTileGrid } from "../mapBuilder";

type RoomTiles = { floor?: TileId; wall?: TileId };

/** Walkable floor with a blocked wall all round. Defaults: clean concrete
    (SIDEWALK) inside residential-style walls; civic buildings pass
    BUILDING_MUNICIPAL. */
export function walledRoom(
  width: number,
  height: number,
  { floor = TILE_IDS.SIDEWALK, wall = TILE_IDS.BUILDING_RESIDENTIAL }: RoomTiles = {},
): MutableTileGrid {
  const ground = makeGrid(width, height, floor);
  fillRect(ground, 0, 0, width - 1, 0, wall);
  fillRect(ground, 0, height - 1, width - 1, height - 1, wall);
  fillRect(ground, 0, 0, 0, height - 1, wall);
  fillRect(ground, width - 1, 0, width - 1, height - 1, wall);
  return ground;
}

type InteriorDetails = Omit<InteriorMap, "width" | "height" | "tileWidth" | "tileHeight" | "cameraBounds" | "layers">;

/** The InteriorMap for a finished ground grid: size, collision layer and a
    camera bounded to the whole room come from the grid itself. */
export function assembleInterior(ground: MutableTileGrid, details: InteriorDetails): InteriorMap {
  const height = ground.length;
  const width = ground[0].length;
  return {
    ...details,
    width,
    height,
    tileWidth: TILE_SIZE_PX,
    tileHeight: TILE_SIZE_PX,
    cameraBounds: { x: 0, y: 0, width: width * TILE_SIZE_PX, height: height * TILE_SIZE_PX },
    layers: finalizeLayers(ground, deriveCollisionFromGround(ground)),
  };
}
