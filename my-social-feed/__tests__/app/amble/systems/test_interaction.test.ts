import {
  findInteractableEntity,
  tileFromPixel,
  updateFacing,
  type Facing,
} from "@/app/amble/systems/interaction";
import type { EntityAnchor } from "@/app/amble/data/schema";

const entity = (id: string, tileX: number, tileY: number, type: EntityAnchor["type"] = "npc"): EntityAnchor => ({
  id,
  type,
  position: { tileX, tileY },
});

describe("updateFacing", () => {
  it("faces east when the player moves right", () => {
    expect(updateFacing("south", { dx: 1, dy: 0 })).toBe("east");
  });

  it("faces west when the player moves left", () => {
    expect(updateFacing("south", { dx: -1, dy: 0 })).toBe("west");
  });

  it("faces south when the player moves down", () => {
    expect(updateFacing("north", { dx: 0, dy: 1 })).toBe("south");
  });

  it("faces north when the player moves up", () => {
    expect(updateFacing("south", { dx: 0, dy: -1 })).toBe("north");
  });

  it("prefers horizontal facing when both axes are pressed", () => {
    expect(updateFacing("north", { dx: 1, dy: 1 })).toBe("east");
  });

  it("keeps the previous facing when no direction is pressed", () => {
    expect(updateFacing("west", { dx: 0, dy: 0 })).toBe("west");
  });
});

describe("tileFromPixel", () => {
  it("floors pixels into their tile", () => {
    expect(tileFromPixel(0, 0, 32)).toEqual({ tileX: 0, tileY: 0 });
    expect(tileFromPixel(31, 31, 32)).toEqual({ tileX: 0, tileY: 0 });
    expect(tileFromPixel(32, 32, 32)).toEqual({ tileX: 1, tileY: 1 });
    expect(tileFromPixel(100, 63, 32)).toEqual({ tileX: 3, tileY: 1 });
  });
});

describe("findInteractableEntity", () => {
  const entities: EntityAnchor[] = [
    entity("north", 10, 9),
    entity("south", 10, 11),
    entity("east", 11, 10),
    entity("west", 9, 10),
    entity("faraway", 30, 30),
  ];

  it("picks the entity in the direction the avatar is facing", () => {
    expect(findInteractableEntity(10, 10, "east", entities)?.id).toBe("east");
    expect(findInteractableEntity(10, 10, "north", entities)?.id).toBe("north");
    expect(findInteractableEntity(10, 10, "west", entities)?.id).toBe("west");
    expect(findInteractableEntity(10, 10, "south", entities)?.id).toBe("south");
  });

  it("picks the entity on the same tile if nothing is directly in front", () => {
    const onTile: EntityAnchor[] = [entity("here", 10, 10)];
    // Facing east — no entity to the east — falls back to on-tile.
    expect(findInteractableEntity(10, 10, "east", onTile)?.id).toBe("here");
  });

  it("falls back to a 4-neighbour if nothing is in front or on-tile", () => {
    const sideOnly: EntityAnchor[] = [entity("side", 11, 10)];
    // Facing north — entity is east, still counts.
    expect(findInteractableEntity(10, 10, "north", sideOnly)?.id).toBe("side");
  });

  it("returns null when nothing is within one tile", () => {
    expect(findInteractableEntity(0, 0, "south", entities)).toBeNull();
  });
});
