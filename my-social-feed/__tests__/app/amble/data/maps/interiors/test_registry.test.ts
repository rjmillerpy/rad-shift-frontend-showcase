import { getInterior, INTERIORS_BY_ID } from "@/app/amble/data/maps/interiors/registry";
import { TOWN } from "@/app/amble/data/town";

describe("interior registry", () => {
  it("is the town's interiors", () => {
    expect(INTERIORS_BY_ID).toBe(TOWN.interiors);
  });

  it("finds each interior by id", () => {
    for (const [id, interior] of Object.entries(TOWN.interiors)) {
      expect(getInterior(id)).toBe(interior);
    }
  });

  it("returns null for an unknown id", () => {
    expect(getInterior("no-such-interior")).toBeNull();
  });
});
