/**
 * Boundary schemas for the Amble feed (rules 5, 13, 16).
 *
 * Hand-written for Phase 1.0 while the backend openapi.json is still being
 * defined; will be replaced by generated Zod once the backend ships and
 * OpenAPI codegen is wired up (see spec). Contract test in
 * __tests__/integration/ will pin any drift once the endpoint is live.
 */
import { z } from "zod";

// ── Avatar ─────────────────────────────────────────────────────────────────
// Field names use snake_case to match the backend wire format (rule 16 —
// one source of truth). The Python side lives at
// app/amble/avatar/schema.py; keep them in sync until OpenAPI codegen lands.
export const AvatarHalfSchema = z.object({
  gender: z.enum(["boy", "girl"]),
  skin_tone: z.string().min(1).max(32),
  hairstyle: z.string().min(1).max(32),
  clothing: z.string().min(1).max(32),
});
export type AvatarHalf = z.infer<typeof AvatarHalfSchema>;

export const AvatarSchema = z.object({
  left: AvatarHalfSchema,
  right: AvatarHalfSchema,
});
export type Avatar = z.infer<typeof AvatarSchema>;

export const AvatarResponseSchema = z.object({
  avatar: AvatarSchema.nullable(),
  exists: z.boolean(),
});
export type AvatarResponse = z.infer<typeof AvatarResponseSchema>;

export const AvatarUpdateRequestSchema = z.object({
  avatar: AvatarSchema,
});
export type AvatarUpdateRequest = z.infer<typeof AvatarUpdateRequestSchema>;

// ── Entity types (stubs — populated in later phases) ────────────────────────
export const EntityTypeSchema = z.enum(["npc", "sign", "building", "object"]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const TilePositionSchema = z.object({
  tileX: z.number().int(),
  tileY: z.number().int(),
});
export type TilePosition = z.infer<typeof TilePositionSchema>;

const PersistentIdentityBindingSchema = z.object({
  kind: z.literal("persistent-identity"),
  usernames: z.array(z.string()).min(1),
  weight: z.number().min(0).max(1),
});

const CategoryBindingSchema = z.object({
  kind: z.literal("category"),
  categories: z.array(z.string()).min(1),
  weight: z.number().min(0).max(1),
});

// Blended bindings recurse; declared with z.lazy for the recursive type.
type EntityBindingType =
  | z.infer<typeof PersistentIdentityBindingSchema>
  | z.infer<typeof CategoryBindingSchema>
  | { kind: "blended"; parts: EntityBindingType[] };

export const EntityBindingSchema: z.ZodType<EntityBindingType> = z.lazy(() =>
  z.union([
    PersistentIdentityBindingSchema,
    CategoryBindingSchema,
    z.object({
      kind: z.literal("blended"),
      parts: z.array(EntityBindingSchema).min(1),
    }),
  ]),
);
export type EntityBinding = EntityBindingType;

const DialogueOverridesSchema = z.object({
  greeting: z.string().optional(),
  emptyState: z.string().optional(),
  closing: z.string().optional(),
});

/**
 * Entity anchor — id + type + tile position + optional facing hint. This is
 * what the map manifest embeds. Bindings live in a separate config file
 * (Phase 1.4) so the map author and the content author can work
 * independently, and a single entity can gain / change bindings without
 * touching the map.
 */
export const EntityAnchorSchema = z.object({
  id: z.string().min(1),
  type: EntityTypeSchema,
  position: TilePositionSchema,
  facingHint: z.enum(["north", "south", "east", "west"]).optional(),
  // Phase 2.1 — building anchors whose interior is walkable declare the
  // id of an InteriorMap here. When the player interacts with such an
  // anchor, AmbleScene stops and hands off to InteriorScene with this id.
  interiorMapId: z.string().min(1).optional(),
});
export type EntityAnchor = z.infer<typeof EntityAnchorSchema>;

export const EntityConfigSchema = EntityAnchorSchema.extend({
  binding: EntityBindingSchema,
  dialogueOverrides: DialogueOverridesSchema.optional(),
});
export type EntityConfig = z.infer<typeof EntityConfigSchema>;

// ── Content (INT-01) ───────────────────────────────────────────────────────
// Mirrors `AmblePost` / `AmbleContentResponse` in the backend's
// app/amble/content/schema.py. Adding a field there needs a matching change here.
export const AmblePostSchema = z.object({
  id: z.number().int(),
  author: z.string(),
  text: z.string(),
  unix_timestamp: z.number().int(),
  likes: z.number().int().default(0),
  reposts: z.number().int().default(0),
  saves: z.number().int().default(0),
  liked_by_me: z.boolean().default(false),
  reposted_by_me: z.boolean().default(false),
});
export type AmblePost = z.infer<typeof AmblePostSchema>;

export const AmbleContentResponseSchema = z.object({
  entity_id: z.string(),
  posts: z.array(AmblePostSchema),
  next_cursor: z.string().nullable(),
  empty: z.boolean(),
});
export type AmbleContentResponse = z.infer<typeof AmbleContentResponseSchema>;

const CameraBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

// ── Tile layer shapes ──────────────────────────────────────────────────────
// A "layer" is a 2D array indexed [row][col]. Ground layer holds tile ids;
// collision layer holds 0 (walkable) / 1 (blocked). Zod validates shape but
// not internal-row length equivalence — the map builder guarantees rects
// (rule 5 boundary; runtime consistency owned by the builder).
const TileGridSchema = z.array(z.array(z.number().int().nonnegative())).min(1);
const CollisionGridSchema = z.array(z.array(z.union([z.literal(0), z.literal(1)]))).min(1);

export const MapLayersSchema = z.object({
  ground: TileGridSchema,
  collision: CollisionGridSchema,
  decoration: TileGridSchema.optional(),
});
export type MapLayers = z.infer<typeof MapLayersSchema>;

// ── Interior maps (Phase 2.1) ──────────────────────────────────────────────
// Small handcrafted tilemaps for building interiors. Shape mirrors
// MapManifest but adds a required `exitTile` — the door tile the player
// spawns onto when entering and interacts with to exit. Interior maps
// re-use the same tile ids, collision layer, and entity anchor system as
// the overworld so scene systems don't fork.
//
// Multi-floor buildings are just several InteriorMaps linked by
// `staircases`: standing on a staircase tile and pressing E jumps to the
// target map at the target tile, preserving the eventual overworld
// return-spawn coord so the player can still leave the building via the
// ground floor's exitTile.
const StaircaseSchema = z.object({
  tileX: z.number().int(),
  tileY: z.number().int(),
  targetMapId: z.string().min(1),
  targetTileX: z.number().int(),
  targetTileY: z.number().int(),
  targetFacing: z.enum(["north", "south", "east", "west"]).default("north"),
  // Optional short label — "Upstairs", "Downstairs", "2nd floor". Rendered
  // in the interaction hint. Marker colour is picked from the label prefix
  // (up = cyan, down = magenta, other = white).
  label: z.string().min(1).optional(),
});
export type Staircase = z.infer<typeof StaircaseSchema>;

export const InteriorMapSchema = z.object({
  id: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tileWidth: z.number().int().positive(),
  tileHeight: z.number().int().positive(),
  cameraBounds: CameraBoundsSchema,
  layers: MapLayersSchema,
  entities: z.array(EntityAnchorSchema),
  // Tile the player is placed on when entering, and which they can
  // interact with to exit back to the overworld.
  exitTile: TilePositionSchema,
  // Facing direction the player has just after entering (usually the
  // opposite of the direction they entered from).
  entryFacing: z.enum(["north", "south", "east", "west"]).default("north"),
  // Multi-floor stair transitions. Empty for single-floor interiors.
  staircases: z.array(StaircaseSchema).default([]),
});
export type InteriorMap = z.infer<typeof InteriorMapSchema>;

export const MapManifestSchema = z.object({
  id: z.string().min(1),
  width: z.number().int().positive(),   // tiles wide
  height: z.number().int().positive(),  // tiles tall
  tileWidth: z.number().int().positive(),
  tileHeight: z.number().int().positive(),
  tilesetRefs: z.array(z.string()).default([]),
  cameraBounds: CameraBoundsSchema,
  layers: MapLayersSchema,
  entities: z.array(EntityAnchorSchema),
});
export type MapManifest = z.infer<typeof MapManifestSchema>;
