"use client";
import { useMemo } from "react";
import { TOWN } from "../data/town";
import { MapManifestSchema, type MapManifest } from "../data/schema";

/**
 * Phase 1.2 map loader: returns the town's bundled map (data/town.ts) after
 * validating it through Zod at the boundary (rule 5). When Phase 1.4 adds
 * server-authored maps this hook is where the async fetch lands — the
 * consumer stays the same.
 *
 * `mapId` is accepted for future callers but currently ignored (only one
 * map ships in Phase 1.2). We validate that a caller-requested id matches
 * the bundled map's id so a typo surfaces as `null` rather than a
 * mismatched world (rule 14 — no silent failure).
 */
const BUNDLED_MAPS: ReadonlyArray<MapManifest> = [TOWN.map];

export type UseMapResult = {
  map: MapManifest | null;
  error: string | null;
};

export function useMap(mapId: string): UseMapResult {
  return useMemo<UseMapResult>(() => {
    const bundled = BUNDLED_MAPS.find((m) => m.id === mapId);
    if (bundled === undefined) {
      return { map: null, error: `Unknown map: ${mapId}` };
    }
    const parsed = MapManifestSchema.safeParse(bundled);
    if (!parsed.success) {
      // Bundled maps should never fail validation — that's a build-time bug,
      // not user input. Surface it observably (rule 14).
      console.error("useMap: bundled map failed schema validation", {
        mapId, issues: parsed.error.issues,
      });
      return { map: null, error: "Map data is corrupt" };
    }
    return { map: parsed.data, error: null };
  }, [mapId]);
}

export const DEFAULT_MAP_ID = TOWN.map.id;
