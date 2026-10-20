/**
 * What a town is: the overworld map, the interiors its buildings open onto,
 * and the canned posts the dialogue frame shows while the stub content client
 * is on (services/content-stub.ts). data/town.ts picks the town the app runs:
 * production's is private; the public build ships a small demo town.
 */
import type { AmblePost, InteriorMap, MapManifest } from "./schema";

export type StubPost = Pick<AmblePost, "author" | "text" | "unix_timestamp">;

/** An inclusive rectangle of tiles. */
export type TileBounds = { minCol: number; maxCol: number; minRow: number; maxRow: number };

export type Town = {
  map: MapManifest;
  /** Where park loiterers appear (systems/roamingNpcs.ts); null for no park. */
  parkBounds: TileBounds | null;
  interiors: Readonly<Record<string, InteriorMap>>;
  stubPosts: Readonly<Record<string, ReadonlyArray<StubPost>>>;
};

/** Interiors keyed by their own id (the `interiorMapId` anchors point at). */
export function interiorsById(maps: ReadonlyArray<InteriorMap>): Readonly<Record<string, InteriorMap>> {
  return Object.fromEntries(maps.map((map) => [map.id, map]));
}
