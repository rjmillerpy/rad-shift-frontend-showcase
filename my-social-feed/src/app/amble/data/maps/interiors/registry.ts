/**
 * Interior lookup. Which interiors exist is the town's business
 * (data/town.ts); an overworld anchor's `interiorMapId` and a staircase's
 * `targetMapId` are keys into it.
 */
import type { InteriorMap } from "../../schema";
import { TOWN } from "../../town";

export const INTERIORS_BY_ID: Readonly<Record<string, InteriorMap>> = TOWN.interiors;

export function getInterior(id: string): InteriorMap | null {
  return INTERIORS_BY_ID[id] ?? null;
}
