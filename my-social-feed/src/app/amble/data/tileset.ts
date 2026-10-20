/**
 * Placeholder tileset — a mapping from tile id to a fill colour and a
 * blocked/walkable classification. The full 16-bit tileset atlas replaces
 * these swatches in Phase 1.6 (see docs/amble/sprites-v2.md when authored).
 *
 * Single source of truth (rules 8, 16): the map builder, the renderer, and
 * the collision system all consult this file. Adding a new tile is one row
 * in TILE_COLORS + one entry in BLOCKED_TILE_IDS if it should block.
 */

export const TILE_IDS = {
  GRASS: 0,
  SIDEWALK: 1,
  ROAD: 2,
  CROSSWALK: 3,
  BUILDING_COMMERCIAL: 4,
  BUILDING_RESIDENTIAL: 5,
  PARK_PATH: 6,
  TRAIN_PLATFORM: 7,
  WATER: 8,
  FENCE: 9,
  TRAIN_TRACK: 10,
  TRAIN: 11,
  TRAIN_BLUE: 12,
  BUILDING_MUNICIPAL: 13,
} as const;

export type TileId = (typeof TILE_IDS)[keyof typeof TILE_IDS];

export const TILE_COLORS: Record<TileId, string> = {
  [TILE_IDS.GRASS]: "#7cc96f",
  [TILE_IDS.SIDEWALK]: "#c8c6c4",
  [TILE_IDS.ROAD]: "#4a4a4a",
  [TILE_IDS.CROSSWALK]: "#e0e0e0",
  [TILE_IDS.BUILDING_COMMERCIAL]: "#a55c3d",
  [TILE_IDS.BUILDING_RESIDENTIAL]: "#8a6b4a",
  [TILE_IDS.PARK_PATH]: "#c9b478",
  [TILE_IDS.TRAIN_PLATFORM]: "#6e6e6e",
  [TILE_IDS.WATER]: "#4a7fbf",
  [TILE_IDS.FENCE]: "#5a3a26",
  [TILE_IDS.TRAIN_TRACK]: "#3d2b18",
  // CTA Blue Line: silver stainless-steel body with a light blue stripe.
  [TILE_IDS.TRAIN]: "#c0c0c0",
  [TILE_IDS.TRAIN_BLUE]: "#4a90d0",
  // Beige limestone — libraries, banks, city offices, that sort of thing.
  [TILE_IDS.BUILDING_MUNICIPAL]: "#b4a488",
};

// Tile ids that the collision layer should mark blocked by default. The map
// builder can still override collision per-cell (e.g., a door tile that
// happens to be walkable inside a building outline).
export const BLOCKED_TILE_IDS: ReadonlySet<TileId> = new Set([
  TILE_IDS.BUILDING_COMMERCIAL,
  TILE_IDS.BUILDING_RESIDENTIAL,
  TILE_IDS.BUILDING_MUNICIPAL,
  TILE_IDS.WATER,
  TILE_IDS.FENCE,
  // TRAIN + TRAIN_BLUE removed: the train car sits on an elevated
  // trestle, so the player + roamers walk under it just like they walk
  // under the tracks (rendered at depth 25).
]);

export const TILE_SIZE_PX = 32;
