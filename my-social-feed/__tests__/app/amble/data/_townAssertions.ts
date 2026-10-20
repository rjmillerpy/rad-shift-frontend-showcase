/**
 * The contract every town (data/townTypes.ts) meets, whichever one a build
 * ships. Not a test of one source file: test_town.test.ts runs it on the
 * build's town, and the private repo also runs it on the public demo town.
 */
import { MapManifestSchema } from "@/app/amble/data/schema";
import type { Town } from "@/app/amble/data/townTypes";
import { inBounds, isWalkable } from "./maps/interiors/_mapAssertions";

export function describeTown(name: string, town: Town): void {
  const { map, interiors, stubPosts } = town;
  const anchorIds = [
    ...map.entities.map((e) => e.id),
    ...Object.values(interiors).flatMap((interior) => interior.entities.map((e) => e.id)),
  ];

  describe(`town ${name}`, () => {
    it("has a map that parses with MapManifestSchema", () => {
      expect(MapManifestSchema.parse(map).id).toBe(map.id);
    });

    it("keeps every anchor in bounds with a unique id", () => {
      const ids = map.entities.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      const outside = map.entities.filter(
        (e) => e.position.tileX < 0 || e.position.tileY < 0 || e.position.tileX >= map.width || e.position.tileY >= map.height,
      );
      expect(outside.map((e) => e.id)).toEqual([]);
    });

    it("resolves every interiorMapId and staircase target", () => {
      const missing = [
        ...map.entities.flatMap((e) => (e.interiorMapId && !interiors[e.interiorMapId] ? [e.interiorMapId] : [])),
        ...Object.values(interiors).flatMap((i) => i.staircases.flatMap((s) => (interiors[s.targetMapId] ? [] : [s.targetMapId]))),
      ];
      expect(missing).toEqual([]);
    });

    it("keys every interior by its own id, with a walkable exit", () => {
      for (const [id, interior] of Object.entries(interiors)) {
        expect(interior.id).toBe(id);
        expect(inBounds(interior, interior.exitTile)).toBe(true);
        expect(isWalkable(interior, interior.exitTile)).toBe(true);
      }
    });

    it("only has stub posts for anchors that exist", () => {
      expect(Object.keys(stubPosts).filter((id) => !anchorIds.includes(id))).toEqual([]);
    });
  });
}
