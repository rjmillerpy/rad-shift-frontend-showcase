/**
 * Adjacency + facing math for MOVE-02..MOVE-05.
 *
 * Framework-free (no Phaser types) so tests can drive it without a canvas,
 * same pattern as `movement.ts`.
 */
import type { EntityAnchor } from "../data/schema";
import type { Direction } from "./movement";

export type Facing = "north" | "south" | "east" | "west";

const FACING_DELTA: Record<Facing, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
};

/** Update the avatar's facing from the current move direction. Preserves the
    previous facing when neither axis is pressed so the avatar doesn't lose
    its "look" the instant the player releases every key. Horizontal takes
    priority over vertical when both are pressed. */
export function updateFacing(previous: Facing, direction: Direction): Facing {
  if (direction.dx === 1) return "east";
  if (direction.dx === -1) return "west";
  if (direction.dy === 1) return "south";
  if (direction.dy === -1) return "north";
  return previous;
}

/** Convert a pixel-space position + tile size into integer tile coords. */
export function tileFromPixel(x: number, y: number, tileSizePx: number): { tileX: number; tileY: number } {
  return {
    tileX: Math.floor(x / tileSizePx),
    tileY: Math.floor(y / tileSizePx),
  };
}

/**
 * Which entity, if any, is currently interactable? The rule:
 *   1. If an entity sits on the tile directly in front of the avatar
 *      (based on `facing`), that's the target — MOVE-03 "adjacent to /
 *      facing" language.
 *   2. Otherwise, if an entity sits on the *same tile* as the avatar, use
 *      that one (walking onto a floor sign etc).
 *   3. Otherwise, if any entity is 4-neighbour adjacent (N/S/E/W), pick
 *      the closest by Manhattan distance. Ties break by iteration order.
 *
 * Returns `null` when no entity is in range.
 */
export function findInteractableEntity(
  avatarTileX: number,
  avatarTileY: number,
  facing: Facing,
  entities: readonly EntityAnchor[],
): EntityAnchor | null {
  const { dx, dy } = FACING_DELTA[facing];
  const frontX = avatarTileX + dx;
  const frontY = avatarTileY + dy;

  // Step 1: exact "in front" match.
  const front = entities.find(
    (e) => e.position.tileX === frontX && e.position.tileY === frontY,
  );
  if (front) return front;

  // Step 2: same tile as the avatar.
  const onTile = entities.find(
    (e) => e.position.tileX === avatarTileX && e.position.tileY === avatarTileY,
  );
  if (onTile) return onTile;

  // Step 3: any 4-neighbour, closest wins.
  let closest: EntityAnchor | null = null;
  let closestDist = Number.POSITIVE_INFINITY;
  for (const e of entities) {
    const distX = Math.abs(e.position.tileX - avatarTileX);
    const distY = Math.abs(e.position.tileY - avatarTileY);
    const manhattan = distX + distY;
    if (manhattan <= 1 && manhattan < closestDist) {
      closest = e;
      closestDist = manhattan;
    }
  }
  return closest;
}
