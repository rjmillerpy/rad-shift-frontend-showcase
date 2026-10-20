/**
 * RoamingNpcSystem exports only the class, so it is driven through its public
 * methods. The one Phaser thing it touches, `scene.add.rectangle`, is faked.
 * Math.random is pinned per scenario: 0 -> building visitor heading east to
 * the door; 0.3 -> park loiterer (when the town has a park); 0.5 -> commuter
 * entering at the west edge heading east; 0.99 -> wanderer entering at the
 * east edge heading west.
 */
import { RoamingNpcSystem } from "@/app/amble/systems/roamingNpcs";
import { EntityAnchorSchema, MapManifestSchema, type MapManifest } from "@/app/amble/data/schema";
import { deriveCollisionFromGround, fillRect, makeGrid } from "@/app/amble/data/maps/mapBuilder";
import { isWorldPointBlocked } from "@/app/amble/systems/collision";
import { TILE_IDS } from "@/app/amble/data/tileset";
import type { TileBounds } from "@/app/amble/data/townTypes";

const TILE = 32;
const SIZE = 12; // tiles per side -> 384px
const MAP_PX = SIZE * TILE;
const SPEED = 28; // px per second, the documented strolling speed
const DOOR = { tileX: 6, tileY: 6, x: 6 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 };

/** `spawn` is where it was created; x / y follow the roamer as it moves. */
type Gfx = {
  x: number; y: number; w: number; h: number; color: number;
  depth: number | null; destroyed: boolean; spawn: { x: number; y: number };
};
const spawnedNear = (g: Gfx, x: number, y: number, radius: number) =>
  Math.abs(g.spawn.x - x) <= radius && Math.abs(g.spawn.y - y) <= radius;

function makeMap(options: { door?: "open" | "walled"; blocks?: [number, number, number, number][] } = {}): MapManifest {
  const ground = makeGrid(SIZE, SIZE, TILE_IDS.SIDEWALK);
  for (const [x1, y1, x2, y2] of options.blocks ?? []) fillRect(ground, x1, y1, x2, y2, TILE_IDS.BUILDING_COMMERCIAL);
  if (options.door === "walled") ground[DOOR.tileY][DOOR.tileX] = TILE_IDS.BUILDING_COMMERCIAL;
  return MapManifestSchema.parse({
    id: "test-town", width: SIZE, height: SIZE, tileWidth: TILE, tileHeight: TILE,
    cameraBounds: { x: 0, y: 0, width: MAP_PX, height: MAP_PX },
    layers: { ground, collision: deriveCollisionFromGround(ground) },
    entities: options.door
      ? [{ id: "shop", type: "building", position: { tileX: DOOR.tileX, tileY: DOOR.tileY }, interiorMapId: "shop-interior" }]
      : [],
  });
}

function setup(map: MapManifest, maxRoamers?: number, parkBounds: TileBounds | null = null) {
  const created: Gfx[] = [];
  const scene = {
    add: {
      rectangle: (x: number, y: number, w: number, h: number, color: number) => {
        const gfx: Gfx & { setDepth: (d: number) => void; destroy: () => void } = {
          x, y, w, h, color, depth: null, destroyed: false, spawn: { x, y },
          setDepth(d) { gfx.depth = d; },
          destroy() { gfx.destroyed = true; },
        };
        created.push(gfx);
        return gfx;
      },
    },
  } as unknown as ConstructorParameters<typeof RoamingNpcSystem>[0];
  const system = new RoamingNpcSystem(scene, map, { maxRoamers, parkBounds });
  /** Same rule the scene uses: map collision, and off-map counts as blocked. */
  const mapCollision = (x: number, y: number) => isWorldPointBlocked(map, x, y);
  const tick = (ms: number, times: number, isBlocked: (x: number, y: number) => boolean) => {
    for (let i = 0; i < times; i += 1) system.update(ms, isBlocked);
  };
  return { system, created, mapCollision, tick, alive: () => created.filter((g) => !g.destroyed) };
}

const nothingBlocked = () => false;
const pinRandom = (value: number) => jest.spyOn(Math, "random").mockReturnValue(value);

/** Deterministic PRNG (a 32-bit LCG) so random-driven tests replay identically. */
function seedRandom(seed: number): void {
  let state = seed;
  jest.spyOn(Math, "random").mockImplementation(() => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  });
}

describe("RoamingNpcSystem", () => {
  afterEach(() => jest.restoreAllMocks());

  it("spawns one 16px roamer inside the map on the first tick, then one per 200ms", () => {
    seedRandom(1);
    const { system, created, mapCollision } = setup(makeMap());
    expect(system.count()).toBe(0);

    system.update(0, mapCollision);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ w: 16, h: 16, depth: 20, destroyed: false });
    expect(mapCollision(created[0].x, created[0].y)).toBe(false);

    const counts = [100, 100, 100, 100].map((ms) => (system.update(ms, mapCollision), system.count()));
    expect(counts).toEqual([1, 2, 2, 3]);
  });

  it.each([0, 1, 3])("never holds more than maxRoamers=%i", (max) => {
    seedRandom(2);
    const { system, tick, mapCollision } = setup(makeMap(), max);
    tick(200, 50, mapCollision);
    expect(system.count()).toBe(max);
  });

  it("spawns nothing while every candidate point is blocked", () => {
    seedRandom(3);
    const { system, created, tick } = setup(makeMap({ door: "open" }));
    tick(200, 50, () => true);
    expect([system.count(), created.length]).toEqual([0, 0]);
  });

  it("keeps a random crowd off blocked tiles and inside the cap for a simulated minute", () => {
    seedRandom(4);
    const map = makeMap({ door: "walled", blocks: [[2, 2, 4, 4], [8, 3, 9, 8], [3, 8, 5, 9]] });
    const { system, created, mapCollision, alive } = setup(map, 25);
    const onBlockedTile: string[] = [];
    let peak = 0;
    for (let frame = 0; frame < 600; frame += 1) {
      system.update(100, mapCollision);
      peak = Math.max(peak, system.count());
      for (const g of alive()) if (mapCollision(g.x, g.y)) onBlockedTile.push(`frame ${frame}: (${g.x},${g.y})`);
    }
    expect(alive()).toHaveLength(system.count());
    expect(onBlockedTile).toEqual([]);
    expect(peak).toBe(25);
    expect(created.length).toBeGreaterThan(25); // some left or entered a door and were replaced
    expect(created.every((g) => g.w === 16 && g.h === 16 && Number.isInteger(g.color))).toBe(true);
  });

  it("spawns a park loiterer inside the town's park bounds", () => {
    pinRandom(0.3);
    const park = { minCol: 2, maxCol: 4, minRow: 7, maxRow: 9 };
    const { created, tick } = setup(makeMap(), 1, park);
    tick(0, 1, nothingBlocked);
    const tileX = Math.floor(created[0].spawn.x / TILE);
    const tileY = Math.floor(created[0].spawn.y / TILE);
    expect(tileX).toBeGreaterThanOrEqual(park.minCol);
    expect(tileX).toBeLessThanOrEqual(park.maxCol);
    expect(tileY).toBeGreaterThanOrEqual(park.minRow);
    expect(tileY).toBeLessThanOrEqual(park.maxRow);
  });

  it("falls back to an edge spawn when the town has no park", () => {
    pinRandom(0.3);
    const { created, tick } = setup(makeMap(), 1);
    tick(0, 1, nothingBlocked);
    const { x, y } = created[0].spawn;
    const onEdge = [x, y].some((v) => v === TILE * 1.5 || v === MAP_PX - TILE * 1.5);
    expect(onEdge).toBe(true);
  });

  it("walks a wanderer in a straight line at strolling speed", () => {
    pinRandom(0.99);
    const { created, tick } = setup(makeMap(), 1);
    tick(0, 1, nothingBlocked);
    const start = { ...created[0].spawn };
    expect(start.x).toBe(MAP_PX - TILE * 1.5); // just inside the east edge

    tick(1000, 1, nothingBlocked);
    expect(created[0]).toMatchObject({ x: start.x - SPEED, y: start.y });
    tick(500, 1, nothingBlocked);
    expect(created[0].x).toBeCloseTo(start.x - SPEED * 1.5, 6);
  });

  it("despawns a commuter that walks off the map and sends a counterpart back in", () => {
    pinRandom(0.5);
    const { created, tick } = setup(makeMap(), 1);
    tick(0, 1, nothingBlocked);
    expect(created[0]).toMatchObject({ x: TILE * 1.5, y: MAP_PX / 2 });

    tick(1000, 13, nothingBlocked); // x = 412: past the edge but within the one-tile margin
    expect(created[0].destroyed).toBe(false);
    tick(1000, 1, nothingBlocked); // x = 440 > 384 + 32
    expect(created[0].destroyed).toBe(true);
    expect(created).toHaveLength(2);
    expect(created[1]).toMatchObject({ x: MAP_PX - TILE * 1.5, y: MAP_PX / 2, color: created[0].color });

    tick(1000, 1, nothingBlocked);
    expect(created[1].x).toBe(MAP_PX - TILE * 1.5 - SPEED); // heading back west
  });

  it("walks a visitor into a door and lets them back out of it 3s later", () => {
    pinRandom(0);
    const { created, tick, mapCollision } = setup(makeMap({ door: "open" }), 1);
    tick(0, 1, mapCollision);
    expect(created[0]).toMatchObject({ x: DOOR.x - 3 * TILE, y: DOOR.y });

    let enteredAt = -1;
    let cameOutAt = -1;
    for (let frame = 1; frame <= 150 && cameOutAt < 0; frame += 1) {
      tick(100, 1, mapCollision);
      if (enteredAt < 0 && created[0].destroyed) enteredAt = frame;
      if (created.some((g) => spawnedNear(g, DOOR.x, DOOR.y, 0))) cameOutAt = frame;
    }
    expect(Math.abs(created[0].x - DOOR.x)).toBeLessThan(TILE); // arrived within a tile of the door
    expect(created[0].y).toBe(DOOR.y);
    expect(enteredAt).toBeGreaterThan(0);
    expect(cameOutAt - enteredAt).toBeGreaterThanOrEqual(30); // 3000ms minimum stay
    const leaver = created.find((g) => spawnedNear(g, DOOR.x, DOOR.y, 0)) as Gfx;
    expect(leaver.color).toBe(created[0].color);
    tick(1000, 1, mapCollision);
    expect(Math.abs(leaver.x - DOOR.x) + Math.abs(leaver.y - DOOR.y)).toBe(SPEED); // walks away
  });

  describe("with the door on a blocked building tile, as on the real map", () => {
    const run = () => {
      pinRandom(0);
      const world = setup(makeMap({ door: "walled" }), 1);
      world.tick(100, 300, world.mapCollision);
      return world.created;
    };

    it("still lets visitors arrive beside the door and go in", () => {
      const first = run()[0];
      expect(first.destroyed).toBe(true);
      expect([Math.abs(first.x - DOOR.x) < TILE, first.y]).toEqual([true, DOOR.y]);
    });

    // KNOWN ISSUE: exit-spawns are queued at the door tile's centre, but door
    // anchors sit on blocked building tiles (nearly all of them on a real map) and
    // trySpawn silently drops queued spawns whose point is blocked.
    it.failing("lets a visitor back out again", () => {
      // Arriving visitors are created 3+ tiles out; anyone created at the door came out of it.
      expect(run().filter((g) => spawnedNear(g, DOOR.x, DOOR.y, TILE * 1.5)).length).toBeGreaterThan(0);
    });
  });

  it("despawns a roamer after more than six consecutive bumps", () => {
    pinRandom(0.99);
    let blocked = false;
    const { system, created, tick } = setup(makeMap(), 1);
    tick(0, 1, () => blocked);
    blocked = true;
    tick(100, 6, () => blocked);
    expect(created[0].destroyed).toBe(false);
    tick(100, 1, () => blocked);
    expect(created[0].destroyed).toBe(true);
    expect([system.count(), created.length]).toEqual([0, 1]);
  });

  // KNOWN ISSUE: a roamer boxed in for one frame is frozen with dx=dy=0
  // ("until we can move again"), but commuters never re-pick a direction and
  // wanderers on a street tile only extend their hold, so it stands forever.
  it.failing.each([["commuter", 0.5], ["street wanderer", 0.99]])(
    "gets a boxed-in %s moving again once the way is clear",
    (_name, random) => {
      pinRandom(random);
      let blocked = false;
      const { created, tick } = setup(makeMap(), 1);
      tick(0, 1, () => blocked);
      blocked = true;
      tick(100, 1, () => blocked);
      blocked = false;
      tick(1000, 30, () => blocked);
      expect({ x: created[0].x, y: created[0].y }).not.toEqual(created[0].spawn);
    },
  );

  it.each([
    ["its centre", 0, 0, true],
    ["just inside the combined half-sizes", 15.5, -15.5, true],
    ["exactly the combined half-sizes away in x", 16, 0, false],
    ["exactly the combined half-sizes away in y", 0, -16, false],
    ["far away", 100, 100, false],
  ])("isBlockedByRoamer at %s", (_name, dx, dy, expected) => {
    pinRandom(0.5);
    const { system, created, tick } = setup(makeMap(), 1);
    expect(system.isBlockedByRoamer(TILE * 1.5, MAP_PX / 2, 8)).toBe(false); // no roamers yet
    tick(0, 1, nothingBlocked);
    expect(system.isBlockedByRoamer(created[0].x + dx, created[0].y + dy, 8)).toBe(expected);
  });

  it("exposes each roamer as a wanderer npc anchor on its current tile, and clears on destroyAll", () => {
    seedRandom(5);
    const { system, created, tick, mapCollision, alive } = setup(makeMap(), 6);
    tick(200, 20, mapCollision);
    const anchors = system.getInteractableEntities();

    expect(anchors).toHaveLength(6);
    expect(anchors).toEqual(alive().map((g) => ({
      id: "wanderer", type: "npc", position: { tileX: Math.floor(g.x / TILE), tileY: Math.floor(g.y / TILE) },
    })));
    for (const a of anchors) expect(EntityAnchorSchema.parse(a)).toEqual(a);

    system.destroyAll();
    expect(system.count()).toBe(0);
    expect(created.every((g) => g.destroyed)).toBe(true);
    expect(system.getInteractableEntities()).toEqual([]);
    expect(system.isBlockedByRoamer(created[0].x, created[0].y, 8)).toBe(false);
  });
});
