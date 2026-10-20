/**
 * Ambient roaming-NPC system. Spawns NPCs at random map edges, walks
 * them through the neighbourhood with a light bit of AI (random turns,
 * bump-and-turn against walls), and despawns them when they wander off
 * the map. Purely visual — roamers don't participate in the entity
 * anchor / dialogue system.
 *
 * Kept behind its own class so `AmbleScene` stays a thin coordinator.
 */
import * as Phaser from "phaser";

import type { EntityAnchor, MapManifest } from "../data/schema";
import { TILE_IDS } from "../data/tileset";
import type { TileBounds } from "../data/townTypes";

// Roamers all share the same content anchor id ("wanderer" — the entity
// already bound in YAML to `wanderlust, cityscape`). Any roamer the
// player interacts with surfaces the same wanderer feed, so the crowd
// reads as one collective vibe without needing per-roamer bindings.
const ROAMER_ANCHOR_ID = "wanderer";
const DEFAULT_MAX_ROAMERS = 250;
// Spawn as fast as we drain — once max is hit, edge exits create room
// for new arrivals at roughly the same cadence.
const SPAWN_INTERVAL_MS = 200;
// Chance (0..1) that a spawn attempt biases toward a street (road /
// sidewalk) tile at the edge instead of accepting the first walkable
// edge cell. Higher = more foot traffic on the main streets.
const STREET_SPAWN_BIAS = 0.85;
// Chance (0..1) that a fresh spawn is a "purposeful" roamer that walks
// straight toward the opposite edge instead of wandering. When one
// exits, a return-spawn is queued so a counter-part enters near the
// exit point going the other way — the town reads as commuters passing
// through rather than aimless drifters.
const PURPOSEFUL_SPAWN_CHANCE = 0.55;
// How far from the exit tile the counter-part enters (tiles). Small
// jitter so the reappearance doesn't look like the same roamer teleporting.
const RETURN_SPAWN_JITTER_TILES = 3;
// Fraction of new spawns that appear IN the park area (as loiterers who
// wander within the park bounds instead of crossing the map). Loiterers
// wander with normal wander rules but don't get counted toward the
// "purposeful commuter" pool.
const PARK_LOITER_CHANCE = 0.15;
// Fraction of new spawns that become "building visitors" — appear on a
// nearby sidewalk cell heading toward a door, then despawn into the
// building on arrival. Each despawn queues a matching "exit-spawn"
// after BUILDING_EXIT_DELAY_MS so the town reads as people visiting.
const BUILDING_VISITOR_CHANCE = 0.20;
const BUILDING_EXIT_DELAY_MIN_MS = 3000;
const BUILDING_EXIT_DELAY_MAX_MS = 8000;
// Where park loiterers appear is the town's business (Town.parkBounds in
// data/townTypes.ts); a town with no park has none.

// Tile ids that count as "on a street". Roamers preferentially spawn on
// these edges, and while walking they tend to keep going straight when
// their next step lands on a street tile (see stepPreservesStreetBias
// in moveRoamers).
const STREET_TILE_IDS: ReadonlySet<number> = new Set([
  TILE_IDS.ROAD,
  TILE_IDS.SIDEWALK,
  TILE_IDS.CROSSWALK,
]);
// Slow (~1 tile/sec) so roamers read as "strolling", not sprinting.
const SPEED_PX_PER_SEC = 28;
// How often each roamer may change direction (uniform 3-7s).
const MIN_DIR_HOLD_MS = 3000;
const MAX_DIR_HOLD_MS = 7000;
// How many collision bumps a roamer tolerates before we despawn it (a
// roamer that's stuck in a corner isn't fun to watch).
const MAX_STUCK_BUMPS = 6;
const ROAMER_HALF_SIZE_PX = 8; // slightly smaller than the player avatar
const ROAMER_DEPTH = 20;

// Diverse palette — each spawn picks a random one so the town feels
// populated. Kept intentionally distinct from the anchor-NPC marker
// color so roamers aren't mistaken for interactable NPCs.
const ROAMER_COLORS: readonly number[] = [
  0xff77aa, // pink
  0x8bd1ff, // sky
  0xa8e6a1, // mint
  0xffd166, // sunflower
  0xef476f, // rose
  0xc39bd3, // lavender
  0xf49164, // apricot
  0xe1e1e1, // pale
];

// Four cardinal directions. Diagonals excluded to keep motion legible.
const DIRECTIONS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

type Roamer = {
  gfx: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  dx: number;
  dy: number;
  dirHoldMs: number;
  stuckCount: number;
  // Purposeful roamers never change direction on their own — they walk
  // straight through town toward the opposite edge, then despawn.
  // Their exit triggers a return-spawn (see returnSpawns).
  purposeful: boolean;
  colorArgb: number;
  // Building-visitor mode — the roamer is heading toward a specific
  // door pixel. When close enough, they "enter" (despawn) and an
  // exit-spawn is queued for the same door on a delay.
  targetDoorX?: number;
  targetDoorY?: number;
};

type QueuedSpawn = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  purposeful: boolean;
  colorArgb: number;
  targetDoorX?: number;
  targetDoorY?: number;
};

type DelayedSpawn = {
  spawn: QueuedSpawn;
  fireAtMs: number;
};

type DoorPoint = { x: number; y: number };

type CollisionCheck = (x: number, y: number) => boolean;

export type RoamerOptions = {
  maxRoamers?: number;
  /** Tile rectangle park loiterers spawn in; null skips them. */
  parkBounds?: TileBounds | null;
};

export class RoamingNpcSystem {
  private roamers: Roamer[] = [];
  private spawnCooldownMs = 0;
  // Queue of return-spawns from purposeful roamers that walked off map.
  // Drained one-per-tick so counter-parts show up in a natural rhythm.
  private returnSpawns: QueuedSpawn[] = [];
  // Building-exit spawns fire on a delay after a visitor "enters" — so
  // the same door produces both arrivals and departures over time.
  private delayedSpawns: DelayedSpawn[] = [];
  // Pre-extracted list of enterable-building door pixels (tile centre
  // of every entity that has an interiorMapId). Empty when the map has
  // no enterable buildings, in which case building-visitor spawns are
  // skipped.
  private readonly doors: readonly DoorPoint[];
  private nowMs: number = 0;
  private readonly maxRoamers: number;
  private readonly mapWidthPx: number;
  private readonly mapHeightPx: number;
  private readonly tileWidth: number;
  private readonly tileHeight: number;
  private readonly ground: readonly (readonly number[])[];
  private readonly mapWidthTiles: number;
  private readonly mapHeightTiles: number;

  private readonly parkBounds: TileBounds | null;

  constructor(
    private scene: Phaser.Scene,
    map: MapManifest,
    { maxRoamers = DEFAULT_MAX_ROAMERS, parkBounds = null }: RoamerOptions = {},
  ) {
    this.maxRoamers = maxRoamers;
    this.parkBounds = parkBounds;
    this.tileWidth = map.tileWidth;
    this.tileHeight = map.tileHeight;
    this.mapWidthTiles = map.width;
    this.mapHeightTiles = map.height;
    this.mapWidthPx = map.width * map.tileWidth;
    this.mapHeightPx = map.height * map.tileHeight;
    this.ground = map.layers.ground;
    // Snapshot doors once — the entity list is static per map. Each
    // door is stored as the tile-centre pixel so distance checks read
    // cleanly against roamer positions.
    this.doors = map.entities
      .filter((e) => !!e.interiorMapId)
      .map((e) => ({
        x: e.position.tileX * map.tileWidth + map.tileWidth / 2,
        y: e.position.tileY * map.tileHeight + map.tileHeight / 2,
      }));
  }

  private tileIdAt(px: number, py: number): number | null {
    const tx = Math.floor(px / this.tileWidth);
    const ty = Math.floor(py / this.tileHeight);
    if (tx < 0 || ty < 0 || tx >= this.mapWidthTiles || ty >= this.mapHeightTiles) {
      return null;
    }
    return this.ground[ty][tx];
  }

  private isStreetAt(px: number, py: number): boolean {
    const id = this.tileIdAt(px, py);
    return id !== null && STREET_TILE_IDS.has(id);
  }

  update(deltaMs: number, isBlocked: CollisionCheck): void {
    this.nowMs += deltaMs;
    this.moveRoamers(deltaMs, isBlocked);
    this.despawnOffscreen();
    this.despawnAtDoors();
    this.drainDelayedSpawns();
    this.trySpawn(deltaMs, isBlocked);
  }

  /** Number of roamers currently on the map. Exposed for tests + HUD. */
  count(): number {
    return this.roamers.length;
  }

  /**
   * Predicate for the player's movement collision — returns true if
   * the given pixel intersects any current roamer's bounding box.
   * `avatarHalfSizePx` is the player's half-size so collision fires
   * when the two boxes overlap, not just when centers coincide.
   *
   * Only used for player→roamer blocking; roamers still walk through
   * one another and through the player (their own AI uses the map
   * collision predicate alone, which keeps the crowd fluid).
   */
  isBlockedByRoamer(x: number, y: number, avatarHalfSizePx: number): boolean {
    const threshold = avatarHalfSizePx + ROAMER_HALF_SIZE_PX;
    for (const r of this.roamers) {
      if (Math.abs(x - r.x) < threshold && Math.abs(y - r.y) < threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Snapshot every roamer as an EntityAnchor at its current tile, so
   * AmbleScene's interaction pipeline (findInteractableEntity + the
   * dialogue INTERACT_EVENT) can treat them like any other NPC.
   * All roamers share id `wanderer` — content routing keys on the anchor
   * id, and the wanderer YAML entry already binds to a generic feed.
   */
  getInteractableEntities(): EntityAnchor[] {
    const entities: EntityAnchor[] = [];
    for (const r of this.roamers) {
      const tileX = Math.floor(r.x / this.tileWidth);
      const tileY = Math.floor(r.y / this.tileHeight);
      entities.push({
        id: ROAMER_ANCHOR_ID,
        type: "npc",
        position: { tileX, tileY },
      });
    }
    return entities;
  }

  private moveRoamers(deltaMs: number, isBlocked: CollisionCheck): void {
    const step = (SPEED_PX_PER_SEC * deltaMs) / 1000;
    for (const r of this.roamers) {
      r.dirHoldMs -= deltaMs;
      // Building-visitor mode overrides the normal direction logic:
      // steer toward the target door greedily each frame. They stay
      // "purposeful"-like (no random turn) until they reach the door.
      if (r.targetDoorX !== undefined && r.targetDoorY !== undefined) {
        const steer = pickAxisTowards(
          r.x, r.y, r.targetDoorX, r.targetDoorY, this.tileWidth,
        );
        r.dx = steer.dx;
        r.dy = steer.dy;
      } else if (!r.purposeful && r.dirHoldMs <= 0) {
        // Wanderers on a street hold their direction longer — streets
        // act like corridors. Off-street wanderers reshuffle randomly.
        if (this.isStreetAt(r.x, r.y)) {
          r.dirHoldMs = randomDirHold();
        } else {
          this.pickNewDirection(r);
        }
      }
      const nx = r.x + r.dx * step;
      const ny = r.y + r.dy * step;
      if (isBlocked(nx, ny)) {
        // Bump — try turning 90° each way; if both blocked, reverse.
        r.stuckCount += 1;
        this.pickNewDirection(r, /* avoidCurrent */ true, isBlocked);
      } else {
        r.x = nx;
        r.y = ny;
        r.stuckCount = 0;
      }
      r.gfx.x = r.x;
      r.gfx.y = r.y;
    }
  }

  private pickNewDirection(
    r: Roamer,
    avoidCurrent: boolean = false,
    isBlocked?: CollisionCheck,
  ): void {
    // Shuffle and pick first non-blocked option (if a checker was given).
    const options = [...DIRECTIONS];
    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    for (const opt of options) {
      if (avoidCurrent && opt.dx === r.dx && opt.dy === r.dy) continue;
      if (isBlocked) {
        // Test 1 tile ahead in the candidate direction.
        const testX = r.x + opt.dx * this.tileWidth;
        const testY = r.y + opt.dy * this.tileHeight;
        if (isBlocked(testX, testY)) continue;
      }
      r.dx = opt.dx;
      r.dy = opt.dy;
      r.dirHoldMs = randomDirHold();
      return;
    }
    // Everything blocked — freeze in place until we can move again.
    r.dx = 0;
    r.dy = 0;
    r.dirHoldMs = randomDirHold();
  }

  private despawnOffscreen(): void {
    const remaining: Roamer[] = [];
    for (const r of this.roamers) {
      const walkedOff =
        r.x < -this.tileWidth ||
        r.y < -this.tileHeight ||
        r.x > this.mapWidthPx + this.tileWidth ||
        r.y > this.mapHeightPx + this.tileHeight;
      const stuck = r.stuckCount > MAX_STUCK_BUMPS;
      if (walkedOff || stuck) {
        // Purposeful roamers that walked cleanly off (not just got
        // stuck against a wall) queue a return-spawn — a counter-part
        // enters the map near where they exited, walking the opposite
        // direction. Same colour so the eye reads it as "the same kind
        // of person coming back" without literally teleporting.
        if (r.purposeful && walkedOff) {
          this.queueReturnSpawn(r);
        }
        r.gfx.destroy();
      } else {
        remaining.push(r);
      }
    }
    this.roamers = remaining;
  }

  /**
   * Cull building visitors that have reached their target door — they
   * "enter" the building (despawn) and queue a delayed exit-spawn so
   * someone comes back out later. Doors and interiors stay purely
   * visual for the crowd — no scene transition happens.
   */
  private despawnAtDoors(): void {
    const remaining: Roamer[] = [];
    for (const r of this.roamers) {
      if (r.targetDoorX === undefined || r.targetDoorY === undefined) {
        remaining.push(r);
        continue;
      }
      const dx = r.x - r.targetDoorX;
      const dy = r.y - r.targetDoorY;
      // Radius 1 tile so a visitor stopped by the door's own collision
      // box (buildings are blocked, so their movement predicate refuses
      // to step onto the door itself) still triggers "arrival" and
      // despawns cleanly rather than loitering against the wall.
      const arrivalRadius = this.tileWidth;
      if (Math.abs(dx) < arrivalRadius && Math.abs(dy) < arrivalRadius) {
        this.queueExitSpawn(r);
        r.gfx.destroy();
      } else {
        remaining.push(r);
      }
    }
    this.roamers = remaining;
  }

  /** Building-exit spawn: appears at the door tile, walks in a random
   * cardinal direction (whichever isn't a wall). Fires after a delay so
   * the arrival and the departure feel like separate visits, not a
   * ping-pong. */
  private queueExitSpawn(entered: Roamer): void {
    const delayMs =
      BUILDING_EXIT_DELAY_MIN_MS +
      Math.random() *
        (BUILDING_EXIT_DELAY_MAX_MS - BUILDING_EXIT_DELAY_MIN_MS);
    this.delayedSpawns.push({
      spawn: {
        x: entered.targetDoorX ?? entered.x,
        y: entered.targetDoorY ?? entered.y,
        dx: 0,
        dy: 0,
        purposeful: false,
        colorArgb: entered.colorArgb,
      },
      fireAtMs: this.nowMs + delayMs,
    });
  }

  private drainDelayedSpawns(): void {
    if (this.delayedSpawns.length === 0) return;
    const kept: DelayedSpawn[] = [];
    for (const d of this.delayedSpawns) {
      if (d.fireAtMs <= this.nowMs) {
        // Direction of exit picked in trySpawn once we know where we
        // are and what's walkable; leave dx/dy at 0 here and let the
        // spawn helper reshuffle.
        this.returnSpawns.push(d.spawn);
      } else {
        kept.push(d);
      }
    }
    this.delayedSpawns = kept;
  }

  /** Compute an entry pixel near where the roamer exited, but on the
   * inside of the map, with a small perpendicular jitter so the
   * counter-part doesn't look like the exact same roamer teleporting.
   */
  private queueReturnSpawn(exited: Roamer): void {
    const insideOffset = this.tileWidth * 1.5;
    const jitterPx = (Math.random() - 0.5) * this.tileWidth * RETURN_SPAWN_JITTER_TILES * 2;
    let x = exited.x;
    let y = exited.y;
    // Clamp the exit position back to just-inside the map on whichever
    // axis the roamer crossed, then jitter along the perpendicular axis.
    if (exited.dx > 0) {
      x = this.mapWidthPx - insideOffset;
      y = clampY(exited.y + jitterPx, this.mapHeightPx);
    } else if (exited.dx < 0) {
      x = insideOffset;
      y = clampY(exited.y + jitterPx, this.mapHeightPx);
    } else if (exited.dy > 0) {
      y = this.mapHeightPx - insideOffset;
      x = clampX(exited.x + jitterPx, this.mapWidthPx);
    } else {
      // dy < 0 (walked off top)
      y = insideOffset;
      x = clampX(exited.x + jitterPx, this.mapWidthPx);
    }
    this.returnSpawns.push({
      x,
      y,
      dx: -exited.dx,
      dy: -exited.dy,
      purposeful: true,
      colorArgb: exited.colorArgb,
    });
  }

  private trySpawn(deltaMs: number, isBlocked: CollisionCheck): void {
    this.spawnCooldownMs -= deltaMs;
    if (this.spawnCooldownMs > 0) return;
    this.spawnCooldownMs = SPAWN_INTERVAL_MS;
    if (this.roamers.length >= this.maxRoamers) return;
    // Return-spawns (from purposeful exits or building exits) get
    // priority — drain the queue first, then fall through to fresh
    // edge picks when it's empty.
    let queued = this.returnSpawns.shift();
    while (queued && isBlocked(queued.x, queued.y)) {
      queued = this.returnSpawns.shift();
    }
    if (queued) {
      // Building-exit spawns have zero initial dx/dy; pick a walkable
      // cardinal so they walk AWAY from the door.
      if (queued.dx === 0 && queued.dy === 0) {
        const walkable = this.pickWalkableDirection(queued.x, queued.y, isBlocked);
        queued = { ...queued, dx: walkable.dx, dy: walkable.dy, purposeful: true };
      }
      this.spawn(queued);
      return;
    }
    const roll = Math.random();
    if (roll < BUILDING_VISITOR_CHANCE) {
      const visitor = this.pickBuildingVisitorSpawn(isBlocked);
      if (visitor) {
        this.spawn(visitor);
        return;
      }
    } else if (roll < BUILDING_VISITOR_CHANCE + PARK_LOITER_CHANCE) {
      const park = this.pickParkSpawn(isBlocked);
      if (park) {
        this.spawn(park);
        return;
      }
    }
    const spawn = this.pickEdgeSpawn(isBlocked);
    if (!spawn) return;
    const purposeful = Math.random() < PURPOSEFUL_SPAWN_CHANCE;
    const color = ROAMER_COLORS[Math.floor(Math.random() * ROAMER_COLORS.length)];
    this.spawn({
      x: spawn.x,
      y: spawn.y,
      dx: spawn.dx,
      dy: spawn.dy,
      purposeful,
      colorArgb: color,
    });
  }

  /** Pick a random walkable cell inside the park's tile bounds. Park
   * roamers behave as regular wanderers once placed — they just start
   * from the park rather than the map edge. */
  private pickParkSpawn(isBlocked: CollisionCheck): QueuedSpawn | null {
    const park = this.parkBounds;
    if (!park) return null;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const tx = park.minCol + Math.floor(Math.random() * (park.maxCol - park.minCol + 1));
      const ty = park.minRow + Math.floor(Math.random() * (park.maxRow - park.minRow + 1));
      const x = tx * this.tileWidth + this.tileWidth / 2;
      const y = ty * this.tileHeight + this.tileHeight / 2;
      if (isBlocked(x, y)) continue;
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      return {
        x,
        y,
        dx: direction.dx,
        dy: direction.dy,
        purposeful: false,
        colorArgb: ROAMER_COLORS[Math.floor(Math.random() * ROAMER_COLORS.length)],
      };
    }
    return null;
  }

  /** Pick a random door and spawn a visitor a few tiles away in a
   * walkable direction, targeting the door pixel. Movement each frame
   * steers greedily toward the target (see moveRoamers). */
  private pickBuildingVisitorSpawn(isBlocked: CollisionCheck): QueuedSpawn | null {
    if (this.doors.length === 0) return null;
    const door = this.doors[Math.floor(Math.random() * this.doors.length)];
    // Try to spawn 3-5 tiles offset from the door in a random cardinal.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const offset = (3 + Math.floor(Math.random() * 3)) * this.tileWidth;
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const x = door.x - dir.dx * offset;
      const y = door.y - dir.dy * offset;
      if (
        x < this.tileWidth ||
        x > this.mapWidthPx - this.tileWidth ||
        y < this.tileHeight ||
        y > this.mapHeightPx - this.tileHeight
      ) {
        continue;
      }
      if (isBlocked(x, y)) continue;
      return {
        x,
        y,
        dx: dir.dx,
        dy: dir.dy,
        purposeful: true,
        colorArgb: ROAMER_COLORS[Math.floor(Math.random() * ROAMER_COLORS.length)],
        targetDoorX: door.x,
        targetDoorY: door.y,
      };
    }
    return null;
  }

  private pickWalkableDirection(
    x: number,
    y: number,
    isBlocked: CollisionCheck,
  ): { dx: number; dy: number } {
    const shuffled = [...DIRECTIONS];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (const d of shuffled) {
      if (!isBlocked(x + d.dx * this.tileWidth, y + d.dy * this.tileHeight)) {
        return d;
      }
    }
    return { dx: 0, dy: 1 };
  }

  private spawn(spec: QueuedSpawn): void {
    const gfx = this.scene.add.rectangle(
      spec.x,
      spec.y,
      ROAMER_HALF_SIZE_PX * 2,
      ROAMER_HALF_SIZE_PX * 2,
      spec.colorArgb,
    );
    gfx.setDepth(ROAMER_DEPTH);
    this.roamers.push({
      gfx,
      x: spec.x,
      y: spec.y,
      dx: spec.dx,
      dy: spec.dy,
      dirHoldMs: randomDirHold(),
      stuckCount: 0,
      purposeful: spec.purposeful,
      colorArgb: spec.colorArgb,
      targetDoorX: spec.targetDoorX,
      targetDoorY: spec.targetDoorY,
    });
  }

  /** Pick a spawn point at a random map edge. With `STREET_SPAWN_BIAS`
   * probability we bias toward a road / sidewalk tile so most roamers
   * enter along the main streets and get carried along the
   * corridor by the street-hold rule in moveRoamers. If no street cell
   * is found after several biased attempts, we fall back to accepting
   * any walkable edge cell. */
  private pickEdgeSpawn(
    isBlocked: CollisionCheck,
  ): { x: number; y: number; dx: number; dy: number } | null {
    const wantStreet = Math.random() < STREET_SPAWN_BIAS;
    let fallback: { x: number; y: number; dx: number; dy: number } | null = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      let dx = 0;
      let dy = 0;
      const insideOffset = this.tileWidth * 1.5;
      if (edge === 0) {
        x = Math.random() * this.mapWidthPx;
        y = insideOffset;
        dx = 0;
        dy = 1;
      } else if (edge === 1) {
        x = Math.random() * this.mapWidthPx;
        y = this.mapHeightPx - insideOffset;
        dx = 0;
        dy = -1;
      } else if (edge === 2) {
        x = insideOffset;
        y = Math.random() * this.mapHeightPx;
        dx = 1;
        dy = 0;
      } else {
        x = this.mapWidthPx - insideOffset;
        y = Math.random() * this.mapHeightPx;
        dx = -1;
        dy = 0;
      }
      if (isBlocked(x, y)) continue;
      // First walkable candidate becomes the fallback in case no street
      // cell shows up in the attempt budget.
      if (fallback === null) fallback = { x, y, dx, dy };
      if (!wantStreet || this.isStreetAt(x, y)) {
        return { x, y, dx, dy };
      }
    }
    return fallback;
  }

  destroyAll(): void {
    for (const r of this.roamers) r.gfx.destroy();
    this.roamers = [];
  }
}

function randomDirHold(): number {
  return MIN_DIR_HOLD_MS + Math.random() * (MAX_DIR_HOLD_MS - MIN_DIR_HOLD_MS);
}

function clampX(x: number, mapWidthPx: number): number {
  return Math.max(4, Math.min(mapWidthPx - 4, x));
}

function clampY(y: number, mapHeightPx: number): number {
  return Math.max(4, Math.min(mapHeightPx - 4, y));
}

/** Greedy one-axis steer toward a target pixel. Picks the axis with the
 * bigger delta, unless the roamer is already close on that axis in
 * which case it flips to the other. Snap threshold prevents jittering
 * across the target. */
function pickAxisTowards(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  tileWidth: number,
): { dx: number; dy: number } {
  const dx = targetX - x;
  const dy = targetY - y;
  const snap = tileWidth * 0.4;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < snap && absY < snap) return { dx: 0, dy: 0 };
  if (absX >= absY) return { dx: dx > 0 ? 1 : -1, dy: 0 };
  return { dx: 0, dy: dy > 0 ? 1 : -1 };
}
