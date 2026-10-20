/** The public demo town (data/town.public.ts), which the public mirror ships as data/town.ts. */
import { TOWN } from "@/app/amble/data/town";
import { describeTown } from "./_townAssertions";
import { describeInteriorMap } from "./maps/interiors/_mapAssertions";

describeTown("demo", TOWN);

describeInteriorMap(TOWN.interiors["demo-cafe-interior"], { id: "demo-cafe-interior", width: 10, height: 7, floor: "ground" }, TOWN);
describeInteriorMap(TOWN.interiors["demo-cafe-interior-2f"], { id: "demo-cafe-interior-2f", width: 10, height: 7, floor: "upper" }, TOWN);

describe("demo town content anchors", () => {
  it("has the four anchors the backend's demo bindings cover", () => {
    const ids = [...TOWN.map.entities, ...TOWN.interiors["demo-cafe-interior"].entities].map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(["wanderer", "welcome-sign", "noticeboard", "cafe-owner"]));
  });

  it("gives every content anchor some stub posts", () => {
    for (const id of ["wanderer", "welcome-sign", "noticeboard", "cafe-owner"]) {
      expect(TOWN.stubPosts[id]?.length).toBeGreaterThan(0);
    }
  });
});
