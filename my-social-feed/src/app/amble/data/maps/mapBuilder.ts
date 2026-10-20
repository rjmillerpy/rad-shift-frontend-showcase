/**
 * Pure helpers for hand-crafting an Amble map without hand-typing every 2D
 * array cell. Once the pixel-art tileset and a proper Tiled export exist,
 * these helpers move to Phase 1.6 as the map-author fallback for tiny
 * placeholder maps.
 *
 * All operations mutate the layer passed in — that keeps the composition
 * readable at the map's callsite. The public entry point returns a
 * fresh map so external callers still see immutability at the boundary.
 */
import type { MapLayers } from "../schema";
import { BLOCKED_TILE_IDS, type TileId } from "../tileset";

export type MutableTileGrid = number[][];
type MutableCollisionGrid = (0 | 1)[][];

/** Allocate a rectangular grid pre-filled with `initial`. */
export function makeGrid(width: number, height: number, initial: number): MutableTileGrid {
  const grid: MutableTileGrid = [];
  for (let y = 0; y < height; y += 1) {
    const row: number[] = new Array(width);
    for (let x = 0; x < width; x += 1) row[x] = initial;
    grid.push(row);
  }
  return grid;
}

/** Same shape as makeGrid but constrained to the 0/1 collision alphabet. */
export function makeCollisionGrid(width: number, height: number): MutableCollisionGrid {
  const grid: MutableCollisionGrid = [];
  for (let y = 0; y < height; y += 1) {
    const row: (0 | 1)[] = new Array(width).fill(0);
    grid.push(row);
  }
  return grid;
}

/** Fill an inclusive rectangle [x1, y1] → [x2, y2] with `tileId`. Values
    outside the grid are silently clipped so the callsite doesn't need to
    remember dimensions. */
export function fillRect(
  grid: MutableTileGrid,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tileId: TileId,
): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const [xMin, xMax] = x1 <= x2 ? [x1, x2] : [x2, x1];
  const [yMin, yMax] = y1 <= y2 ? [y1, y2] : [y2, y1];
  for (let y = Math.max(0, yMin); y <= Math.min(height - 1, yMax); y += 1) {
    for (let x = Math.max(0, xMin); x <= Math.min(width - 1, xMax); x += 1) {
      grid[y][x] = tileId;
    }
  }
}

/** Set a single cell — no-op if out of range. */
export function setTile(
  grid: MutableTileGrid | MutableCollisionGrid,
  x: number,
  y: number,
  value: number,
): void {
  const row = grid[y];
  if (row === undefined) return;
  if (x < 0 || x >= row.length) return;
  (row as number[])[x] = value;
}

/**
 * Stamp a diagonal road as a `thickness × thickness` brush walked along a
 * Bresenham line from (x1, y1) to (x2, y2). Adjacent stamps overlap so the
 * road looks continuous even when the line steps in only one axis.
 */
export function stampDiagonalRoad(
  grid: MutableTileGrid,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tileId: TileId,
  thickness: number = 2,
): void {
  if (thickness < 1) return;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const stepX = x1 < x2 ? 1 : -1;
  const stepY = y1 < y2 ? 1 : -1;
  let error = dx - dy;
  let x = x1;
  let y = y1;
  // Bresenham completes in dx + dy iterations; explicit ceiling (rule 31)
  // guards against a caller passing NaN or something equally silly.
  const maxIterations = dx + dy + 1;
  for (let i = 0; i <= maxIterations; i += 1) {
    fillRect(grid, x, y, x + thickness - 1, y + thickness - 1, tileId);
    if (x === x2 && y === y2) return;
    const doubledError = 2 * error;
    if (doubledError > -dy) {
      error -= dy;
      x += stepX;
    }
    if (doubledError < dx) {
      error += dx;
      y += stepY;
    }
  }
}

/**
 * Build a collision grid from a ground grid by consulting `BLOCKED_TILE_IDS`.
 * Any subsequent per-cell override is the callsite's job (via setTile).
 */
export function deriveCollisionFromGround(ground: MutableTileGrid): MutableCollisionGrid {
  const height = ground.length;
  const width = ground[0]?.length ?? 0;
  const collision = makeCollisionGrid(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tileId = ground[y][x] as TileId;
      collision[y][x] = BLOCKED_TILE_IDS.has(tileId) ? 1 : 0;
    }
  }
  return collision;
}

/** Freeze the mutable grids into a MapLayers value object (rule 12/59). */
export function finalizeLayers(
  ground: MutableTileGrid,
  collision: MutableCollisionGrid,
  decoration?: MutableTileGrid,
): MapLayers {
  return {
    ground: ground.map((row) => row.slice()),
    collision: collision.map((row) => row.slice() as (0 | 1)[]),
    decoration: decoration ? decoration.map((row) => row.slice()) : undefined,
  };
}
