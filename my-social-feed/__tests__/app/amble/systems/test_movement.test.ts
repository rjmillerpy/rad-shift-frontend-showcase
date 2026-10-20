import {
  directionFromKeys,
  move,
  moveWithCollision,
  stepPixels,
  type KeysDown,
  type Position,
} from "@/app/amble/systems/movement";
import { AVATAR_SPEED_PX_PER_S, MS_PER_SECOND } from "@/app/amble/data/constants";

const noKeys: KeysDown = { left: false, right: false, up: false, down: false };

describe("directionFromKeys", () => {
  it.each<[string, KeysDown, -1 | 0 | 1, -1 | 0 | 1]>([
    ["nothing pressed", noKeys,                                  0,  0],
    ["right",           { ...noKeys, right: true },              1,  0],
    ["left",            { ...noKeys, left: true },              -1,  0],
    ["up",              { ...noKeys, up: true },                 0, -1],
    ["down",            { ...noKeys, down: true },               0,  1],
    ["down-right",      { ...noKeys, down: true, right: true },  1,  1],
    ["up-left",         { ...noKeys, up: true, left: true },    -1, -1],
    ["opposing horiz cancels", { ...noKeys, left: true, right: true }, 0, 0],
    ["opposing vert cancels",  { ...noKeys, up: true, down: true },     0, 0],
    ["all four cancel", { left: true, right: true, up: true, down: true }, 0, 0],
  ])("%s → dx=%i dy=%i", (_name, keys, dx, dy) => {
    expect(directionFromKeys(keys)).toEqual({ dx, dy });
  });
});

describe("stepPixels", () => {
  it("returns AVATAR_SPEED_PX_PER_S over exactly one second", () => {
    expect(stepPixels(MS_PER_SECOND)).toBe(AVATAR_SPEED_PX_PER_S);
  });

  it("scales linearly with the frame delta", () => {
    const halfSec = stepPixels(MS_PER_SECOND / 2);
    expect(halfSec).toBe(AVATAR_SPEED_PX_PER_S / 2);
  });

  it("returns 0 for a 0ms delta", () => {
    expect(stepPixels(0)).toBe(0);
  });
});

describe("move", () => {
  it("returns a new object — does not mutate input (rule 12)", () => {
    const start = { x: 10, y: 10 };
    const next = move(start, { dx: 1, dy: 0 }, 5);
    expect(next).toEqual({ x: 15, y: 10 });
    expect(start).toEqual({ x: 10, y: 10 });
    expect(next).not.toBe(start);
  });

  it.each<[string, Position, { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }, number, Position]>([
    ["no direction", { x: 100, y: 200 }, { dx: 0, dy: 0 }, 10, { x: 100, y: 200 }],
    ["right",        { x: 0, y: 0 },     { dx: 1, dy: 0 }, 25, { x: 25, y: 0 }],
    ["up",           { x: 0, y: 100 },   { dx: 0, dy: -1 }, 30, { x: 0, y: 70 }],
    ["diagonal",     { x: 50, y: 50 },   { dx: -1, dy: 1 }, 10, { x: 40, y: 60 }],
  ])("%s", (_name, pos, dir, step, expected) => {
    expect(move(pos, dir, step)).toEqual(expected);
  });
});

describe("moveWithCollision", () => {
  const nothingBlocked = () => false;
  const everythingBlocked = () => true;

  it("acts like plain move when nothing is blocked", () => {
    expect(moveWithCollision({ x: 10, y: 10 }, { dx: 1, dy: 1 }, 5, nothingBlocked)).toEqual({ x: 15, y: 15 });
  });

  it("stays put when the destination is blocked in both axes", () => {
    expect(moveWithCollision({ x: 10, y: 10 }, { dx: 1, dy: 1 }, 5, everythingBlocked)).toEqual({ x: 10, y: 10 });
  });

  it("slides along the y axis when only x is blocked (into a wall)", () => {
    const blockX = (x: number, _y: number) => x >= 15;
    const result = moveWithCollision({ x: 10, y: 10 }, { dx: 1, dy: 1 }, 5, blockX);
    expect(result).toEqual({ x: 10, y: 15 });
  });

  it("slides along the x axis when only y is blocked (into a ceiling)", () => {
    const blockY = (_x: number, y: number) => y >= 15;
    const result = moveWithCollision({ x: 10, y: 10 }, { dx: 1, dy: 1 }, 5, blockY);
    expect(result).toEqual({ x: 15, y: 10 });
  });
});
