/**
 * Collision system: pure predicates on a MapManifest's collision layer.
 * No Phaser types — testable in jsdom without a canvas.
 *
 * The public surface is intentionally small (rule 61): callers ask "is this
 * world position blocked?" or "is this tile blocked?" and the movement
 * system uses those answers to slide the avatar.
 */
import type { MapManifest } from "../data/schema";

/** The fields collision needs; both overworld maps and interiors satisfy it. */
type CollisionMap = Pick<MapManifest, "width" | "height" | "tileWidth" | "tileHeight" | "layers">;

/** Returns true when the given tile coordinate is outside the map OR marked
    blocked (1) in the collision layer. Outside-the-map counts as blocked so
    the avatar can never leave the world (MAP-03). */
export function isTileBlocked(map: CollisionMap, tileX: number, tileY: number): boolean {
  if (tileY < 0 || tileY >= map.height) return true;
  if (tileX < 0 || tileX >= map.width) return true;
  const row = map.layers.collision[tileY];
  if (row === undefined) return true;
  return row[tileX] === 1;
}

/** Convert a world pixel position to a tile column. */
export function worldToTileX(worldX: number, tileWidth: number): number {
  return Math.floor(worldX / tileWidth);
}

/** Convert a world pixel row to a tile row. */
export function worldToTileY(worldY: number, tileHeight: number): number {
  return Math.floor(worldY / tileHeight);
}

/** True when a point in world coordinates falls inside a blocked tile. */
export function isWorldPointBlocked(
  map: CollisionMap,
  worldX: number,
  worldY: number,
): boolean {
  const tileX = worldToTileX(worldX, map.tileWidth);
  const tileY = worldToTileY(worldY, map.tileHeight);
  return isTileBlocked(map, tileX, tileY);
}

/**
 * True when an axis-aligned square avatar centred at (cx, cy) with half-side
 * `half` would overlap any blocked tile. Checks the four corners of the
 * bounding box — good enough for tile-based movement without pixel-perfect
 * sub-tile jitter. If we later need swept-collision (e.g., very fast
 * dashes), that's a Phase 1.3+ upgrade.
 */
export function isAvatarBoxBlocked(
  map: CollisionMap,
  centerX: number,
  centerY: number,
  halfSize: number,
): boolean {
  const left = centerX - halfSize;
  const right = centerX + halfSize - 1;
  const top = centerY - halfSize;
  const bottom = centerY + halfSize - 1;
  return (
    isWorldPointBlocked(map, left, top) ||
    isWorldPointBlocked(map, right, top) ||
    isWorldPointBlocked(map, left, bottom) ||
    isWorldPointBlocked(map, right, bottom)
  );
}
