/**
 * Shared structural checks for the per-file interior map tests. Not a test of
 * any one source file: each `test_<map>.test.ts` calls `describeInteriorMap`
 * so the invariants live in one place.
 *
 * Every check collects human-readable violations and asserts the list is
 * empty, so a failure names the exact map, tile and rule.
 */
import { InteriorMapSchema, type InteriorMap } from "@/app/amble/data/schema";
import { TOWN } from "@/app/amble/data/town";
import type { Town } from "@/app/amble/data/townTypes";
import { BLOCKED_TILE_IDS, TILE_SIZE_PX, type TileId } from "@/app/amble/data/tileset";

type Tile = { tileX: number; tileY: number };
type Grid = readonly (readonly number[])[];

const key = (t: Tile): string => `(${t.tileX},${t.tileY})`;
const NEIGHBOURS: readonly Tile[] = [
  { tileX: 1, tileY: 0 }, { tileX: -1, tileY: 0 }, { tileX: 0, tileY: 1 }, { tileX: 0, tileY: -1 },
];

export function inBounds(map: InteriorMap, t: Tile): boolean {
  return t.tileX >= 0 && t.tileY >= 0 && t.tileX < map.width && t.tileY < map.height;
}

export function isWalkable(map: InteriorMap, t: Tile): boolean {
  return inBounds(map, t) && map.layers.collision[t.tileY]?.[t.tileX] === 0;
}

/** Rows whose length differs from `width`, plus a wrong row count. */
export function gridShapeViolations(name: string, grid: Grid, width: number, height: number): string[] {
  const out: string[] = [];
  if (grid.length !== height) out.push(`${name}: ${grid.length} rows, expected ${height}`);
  grid.forEach((row, y) => {
    if (row.length !== width) out.push(`${name} row ${y}: ${row.length} cols, expected ${width}`);
  });
  return out;
}

/** Tiles the player can walk to from `start` (4-neighbour flood fill). */
export function reachableFrom(map: InteriorMap, start: Tile): Set<string> {
  const seen = new Set<string>();
  if (!isWalkable(map, start)) return seen;
  const queue: Tile[] = [start];
  seen.add(key(start));
  while (queue.length > 0) {
    const current = queue.shift() as Tile;
    for (const d of NEIGHBOURS) {
      const next = { tileX: current.tileX + d.tileX, tileY: current.tileY + d.tileY };
      if (isWalkable(map, next) && !seen.has(key(next))) {
        seen.add(key(next));
        queue.push(next);
      }
    }
  }
  return seen;
}

/** True when the player can stand on, or 4-adjacent to, `target` — the
    range `findInteractableEntity` accepts. */
function isInteractable(reachable: Set<string>, target: Tile): boolean {
  return [{ tileX: 0, tileY: 0 }, ...NEIGHBOURS].some((d) =>
    reachable.has(key({ tileX: target.tileX + d.tileX, tileY: target.tileY + d.tileY })),
  );
}

type KnownIssue = "perimeter" | "sentinelExit" | "reachability";

export type InteriorSpec = {
  id: string;
  width: number;
  height: number;
  /** "ground" floors connect to the overworld; "upper" floors only via stairs. */
  floor: "ground" | "upper";
  /** Checks this map is known to violate; they run as `it.failing`. */
  knownIssues?: ReadonlyArray<KnownIssue>;
};

/** `town` defaults to the build's town; pass another to check its interiors. */
export function describeInteriorMap(map: InteriorMap, spec: InteriorSpec, town: Town = TOWN): void {
  const getInterior = (id: string): InteriorMap | null => town.interiors[id] ?? null;
  const known = new Set(spec.knownIssues ?? []);
  const itUnless = (issue: KnownIssue) => (known.has(issue) ? it.failing : it);
  const stairAt = (t: Tile) => map.staircases.some((s) => s.tileX === t.tileX && s.tileY === t.tileY);
  const onPerimeter = (t: Tile) =>
    t.tileX === 0 || t.tileY === 0 || t.tileX === map.width - 1 || t.tileY === map.height - 1;

  describe(`interior map ${spec.id}`, () => {
    it("parses with InteriorMapSchema without needing any schema default", () => {
      const parsed = InteriorMapSchema.parse(map);
      expect(parsed).toEqual(map);
      expect(map.staircases).toBeInstanceOf(Array);
    });

    it("has the expected id, size and pixel camera bounds", () => {
      expect({ id: map.id, width: map.width, height: map.height }).toEqual({
        id: spec.id, width: spec.width, height: spec.height,
      });
      expect([map.tileWidth, map.tileHeight]).toEqual([TILE_SIZE_PX, TILE_SIZE_PX]);
      expect(map.cameraBounds).toEqual({
        x: 0, y: 0, width: map.width * map.tileWidth, height: map.height * map.tileHeight,
      });
    });

    it("has rectangular layers matching width x height", () => {
      const { ground, collision, decoration } = map.layers;
      expect([
        ...gridShapeViolations("ground", ground, map.width, map.height),
        ...gridShapeViolations("collision", collision, map.width, map.height),
        ...(decoration ? gridShapeViolations("decoration", decoration, map.width, map.height) : []),
      ]).toEqual([]);
    });

    it("blocks exactly the tiles whose ground id is a blocking tile", () => {
      const violations: string[] = [];
      map.layers.ground.forEach((row, tileY) => row.forEach((tileId, tileX) => {
        const expected = BLOCKED_TILE_IDS.has(tileId as TileId) ? 1 : 0;
        const actual = map.layers.collision[tileY]?.[tileX];
        if (actual !== expected) violations.push(`${key({ tileX, tileY })} tile ${tileId}: collision ${actual}`);
      }));
      expect(violations).toEqual([]);
    });

    // KNOWN ISSUE where listed in spec.knownIssues: the floor has a walkable
    // notch in its outer wall that is neither the exit nor a staircase.
    itUnless("perimeter")("walls off the whole perimeter except the exit and stair tiles", () => {
      const open: string[] = [];
      for (let tileY = 0; tileY < map.height; tileY += 1) {
        for (let tileX = 0; tileX < map.width; tileX += 1) {
          const t = { tileX, tileY };
          if (!onPerimeter(t) || key(t) === key(map.exitTile) || stairAt(t)) continue;
          if (isWalkable(map, t)) open.push(key(t));
        }
      }
      expect(open).toEqual([]);
    });

    it("keeps the exit tile inside the map and walkable", () => {
      expect(inBounds(map, map.exitTile)).toBe(true);
      expect(isWalkable(map, map.exitTile)).toBe(true);
    });

    if (spec.floor === "ground") {
      it("puts the exit door on the perimeter and is entered from the overworld", () => {
        expect(onPerimeter(map.exitTile)).toBe(true);
        const anchors = town.map.entities.filter((e) => e.interiorMapId === map.id);
        expect(anchors.length).toBeGreaterThan(0);
      });
    } else {
      // KNOWN ISSUE where listed: InteriorScene documents that upper floors
      // use their down-staircase cell as a sentinel exitTile so E never
      // leaves to the overworld from upstairs.
      itUnless("sentinelExit")("uses a staircase cell as its sentinel exit tile", () => {
        expect(stairAt(map.exitTile)).toBe(true);
      });

      it("is not wired to any overworld anchor and has a way back down", () => {
        expect(town.map.entities.filter((e) => e.interiorMapId === map.id)).toEqual([]);
        expect(map.staircases.length).toBeGreaterThan(0);
      });
    }

    it("has uniquely identified entities on distinct in-bounds tiles", () => {
      const ids = map.entities.map((e) => e.id);
      const tiles = map.entities.map((e) => key(e.position));
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(tiles).size).toBe(tiles.length);
      expect(map.entities.filter((e) => !inBounds(map, e.position)).map((e) => e.id)).toEqual([]);
    });

    // KNOWN ISSUE where listed: furniture seals part of the floor off, so
    // an entity or staircase can never be interacted with.
    itUnless("reachability")("lets the player reach every entity and staircase from where they arrive", () => {
      // Ground floors are entered on the exit tile, upper floors on a stair.
      const arrival = spec.floor === "ground" ? map.exitTile : map.staircases[0];
      const reachable = reachableFrom(map, arrival);
      const stranded = map.entities.filter((e) => !isInteractable(reachable, e.position)).map((e) => e.id);
      const strandedStairs = map.staircases.filter((s) => !reachable.has(key(s))).map(key);
      expect({ stranded, strandedStairs }).toEqual({ stranded: [], strandedStairs: [] });
    });

    it("links every staircase to a walkable tile of a registered map that links back", () => {
      const violations: string[] = [];
      for (const stair of map.staircases) {
        const target = getInterior(stair.targetMapId);
        const landing = { tileX: stair.targetTileX, tileY: stair.targetTileY };
        if (!isWalkable(map, stair)) violations.push(`stair ${key(stair)} is not walkable`);
        if (!target) {
          violations.push(`stair ${key(stair)} targets unknown map ${stair.targetMapId}`);
        } else if (!isWalkable(target, landing)) {
          violations.push(`stair ${key(stair)} lands on blocked/out-of-bounds ${key(landing)}`);
        } else if (!target.staircases.some((s) => s.targetMapId === map.id && key(s) === key(landing))) {
          violations.push(`stair ${key(stair)} landing ${key(landing)} has no stair back to ${map.id}`);
        }
      }
      expect(violations).toEqual([]);
      if (spec.floor === "ground" && map.staircases.length === 0) {
        expect(getInterior(`${map.id}-2f`)).toBeNull();
      }
    });

    it("is registered under its own id", () => {
      expect(getInterior(spec.id)).toBe(map);
    });
  });
}
