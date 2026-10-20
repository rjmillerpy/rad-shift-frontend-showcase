/**
 * InteriorScene driven through its Phaser lifecycle (init / create / update)
 * with a hand-written fake of the few Phaser services it touches: the object
 * factory, the main camera, the keyboard plugin, the scene manager and the
 * scene event emitter. Keys and the emitter are real Phaser objects; the
 * maps, movement, collision and interaction systems are the real ones.
 *
 * Runs on whichever town this build ships (data/town.ts): the rooms are
 * picked from it, so the same test holds for the demo town and production's.
 */
import * as Phaser from "phaser";
import { InteriorScene } from "@/app/amble/scenes/InteriorScene";
import {
  CAMERA_DEADZONE_HEIGHT_PX,
  CAMERA_DEADZONE_WIDTH_PX,
  CAMERA_LERP,
  CAMERA_ZOOM,
  CAMERA_ZOOM_EVENT,
  DIALOGUE_CLOSE_EVENT,
  DIALOGUE_OPEN_EVENT,
  ENTITY_MARKER_COLORS,
  INTERACT_EVENT,
  INTERACT_HINT_EVENT,
  PLACEHOLDER_AVATAR_COLOR,
  SCENE_KEYS,
} from "@/app/amble/data/constants";
import { TOWN } from "@/app/amble/data/town";
import type { InteriorMap } from "@/app/amble/data/schema";

const interiors = Object.values(TOWN.interiors);
const enteredFromOutside = (room: InteriorMap) => TOWN.map.entities.some((e) => e.interiorMapId === room.id);
const walkable = (room: InteriorMap, x: number, y: number) => room.layers.collision[y]?.[x] === 0;
/** A ground floor with an NPC you can face from the tile south of it. */
const ROOM = interiors.find((room) => enteredFromOutside(room) && room.entryFacing === "north"
  && room.entities.some((e) => e.type === "npc" && walkable(room, e.position.tileX, e.position.tileY + 1))) as InteriorMap;
const NPC = ROOM.entities.find((e) => e.type === "npc" && walkable(ROOM, e.position.tileX, e.position.tileY + 1))!;
/** A ground floor with a staircase up. */
const STAIRS_ROOM = interiors.find((room) => enteredFromOutside(room) && room.staircases.length > 0) as InteriorMap;

const TILE = 32;
const centre = (tile: number) => tile * TILE + TILE / 2;
const RETURN = { returnSpawnX: 1234, returnSpawnY: 567 };
type InitData = Parameters<InteriorScene["init"]>[0];
type Shape = { x: number; y: number; color: number };

function boot(data: Partial<InitData> & { interiorMapId: string }) {
  const scene = new InteriorScene();
  const keys = new Map<number, Phaser.Input.Keyboard.Key>();
  const key = (code: number) => {
    if (!keys.has(code)) keys.set(code, new Phaser.Input.Keyboard.Key(null as never, code));
    return keys.get(code) as Phaser.Input.Keyboard.Key;
  };
  const { KeyCodes } = Phaser.Input.Keyboard;
  const rectangles: Shape[] = [];
  const circles: Shape[] = [];
  const camera = { setBounds: jest.fn(), setZoom: jest.fn(), startFollow: jest.fn(), setDeadzone: jest.fn() };
  const start = jest.fn();
  const events = new Phaser.Events.EventEmitter();
  Object.assign(scene, {
    add: {
      rectangle: (x: number, y: number, _w: number, _h: number, color: number) => {
        const shape = { x, y, color };
        rectangles.push(shape);
        return shape;
      },
      circle: (x: number, y: number, _r: number, color: number) => {
        circles.push({ x, y, color });
      },
    },
    cameras: { main: camera },
    input: {
      keyboard: {
        addKey: key,
        createCursorKeys: () => ({
          up: key(KeyCodes.UP), down: key(KeyCodes.DOWN), left: key(KeyCodes.LEFT), right: key(KeyCodes.RIGHT),
        }),
      },
    },
    scene: { start },
    events,
  });
  scene.init({ ...RETURN, ...data });
  scene.create();
  const tap = (code: number) => {
    key(code).onDown(new KeyboardEvent("keydown"));
    scene.update(0, 0);
    key(code).onUp(new KeyboardEvent("keyup"));
  };
  return {
    scene, start, camera, rectangles, circles, key, tap,
    avatar: () => rectangles[rectangles.length - 1],
    shutdown: () => events.emit(Phaser.Scenes.Events.SHUTDOWN),
  };
}

describe("InteriorScene", () => {
  const { KeyCodes } = Phaser.Input.Keyboard;
  let world: ReturnType<typeof boot> | null = null;
  const hints: (string | null)[] = [];
  const interactions: unknown[] = [];
  const onHint = (e: Event) => hints.push((e as CustomEvent).detail.entityId);
  const onInteract = (e: Event) => interactions.push((e as CustomEvent).detail.entity);
  const enter = (data: Partial<InitData> & { interiorMapId: string }) => (world = boot(data));
  const faceNpc = () => enter({ interiorMapId: ROOM.id, spawnTileX: NPC.position.tileX, spawnTileY: NPC.position.tileY + 1 });

  beforeEach(() => {
    hints.length = 0;
    interactions.length = 0;
    window.addEventListener(INTERACT_HINT_EVENT, onHint);
    window.addEventListener(INTERACT_EVENT, onInteract);
  });

  afterEach(() => {
    world?.shutdown(); // drops the scene's window listeners
    world = null;
    window.removeEventListener(INTERACT_HINT_EVENT, onHint);
    window.removeEventListener(INTERACT_EVENT, onInteract);
  });

  it("finds the rooms it needs in this town", () => {
    expect(ROOM).toBeDefined();
    expect(STAIRS_ROOM).toBeDefined();
  });

  it("draws the map, markers and avatar, and points the camera at the avatar", () => {
    const { rectangles, circles, camera, avatar, start } = enter({ interiorMapId: ROOM.id });
    const { width, height, entities, exitTile, staircases } = ROOM;

    expect(rectangles).toHaveLength(width * height + 1);
    expect(avatar()).toEqual({
      x: centre(exitTile.tileX), y: centre(exitTile.tileY), color: PLACEHOLDER_AVATAR_COLOR,
    });
    expect(circles.slice(0, entities.length)).toEqual(entities.map((e) => ({
      x: centre(e.position.tileX), y: centre(e.position.tileY), color: ENTITY_MARKER_COLORS[e.type],
    })));
    expect(circles).toHaveLength(entities.length + 1 + staircases.length);
    expect(circles[entities.length]).toMatchObject({ x: centre(exitTile.tileX), y: centre(exitTile.tileY) });
    expect(camera.setBounds).toHaveBeenCalledWith(0, 0, width * TILE, height * TILE);
    expect(camera.setZoom).toHaveBeenCalledWith(CAMERA_ZOOM);
    expect(camera.startFollow).toHaveBeenCalledWith(avatar(), true, CAMERA_LERP, CAMERA_LERP);
    expect(camera.setDeadzone).toHaveBeenCalledWith(CAMERA_DEADZONE_WIDTH_PX, CAMERA_DEADZONE_HEIGHT_PX);
    expect(start).not.toHaveBeenCalled();
  });

  it("bounces straight back to the overworld for an unknown interior id", () => {
    const { start, rectangles, scene } = enter({ interiorMapId: "no-such-interior" });
    expect(start).toHaveBeenCalledWith(SCENE_KEYS.AMBLE, RETURN);
    expect(rectangles).toHaveLength(0);
    expect(() => scene.update(0, 16)).not.toThrow();
    expect(hints).toEqual([]);
  });

  it("hints the exit on entry and leaves to the overworld return point on E", () => {
    const { scene, start, tap } = enter({ interiorMapId: ROOM.id });
    scene.update(0, 16);
    scene.update(0, 16);
    expect(hints).toEqual(["__exit__"]); // announced once, not every frame

    tap(KeyCodes.E);
    expect(hints).toEqual(["__exit__", null]);
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(SCENE_KEYS.AMBLE, RETURN);
    expect(interactions).toEqual([]);
  });

  it("takes a staircase to its target floor, keeping the overworld return point", () => {
    const stair = STAIRS_ROOM.staircases[0];
    const { start, tap, avatar } = enter({
      interiorMapId: STAIRS_ROOM.id, spawnTileX: stair.tileX, spawnTileY: stair.tileY, spawnFacing: "south",
    });
    expect(avatar()).toMatchObject({ x: centre(stair.tileX), y: centre(stair.tileY) });

    tap(KeyCodes.E);
    expect(hints).toEqual(["__stair_0__", null]);
    expect(start).toHaveBeenCalledWith(SCENE_KEYS.INTERIOR, {
      interiorMapId: stair.targetMapId, ...RETURN,
      spawnTileX: stair.targetTileX, spawnTileY: stair.targetTileY, spawnFacing: stair.targetFacing,
    });
  });

  it("raises an interact event for the entity the avatar faces", () => {
    const { tap, start } = faceNpc(); // default facing is the room's entryFacing (north)
    tap(KeyCodes.E);
    expect(hints).toEqual([NPC.id]);
    expect(interactions).toEqual([NPC]);
    expect(start).not.toHaveBeenCalled();
  });

  it("ignores E while a dialogue is open, and answers again once it closes", () => {
    const { tap } = faceNpc();
    window.dispatchEvent(new CustomEvent(DIALOGUE_OPEN_EVENT));
    tap(KeyCodes.E);
    expect(interactions).toEqual([]);

    window.dispatchEvent(new CustomEvent(DIALOGUE_CLOSE_EVENT));
    tap(KeyCodes.E);
    expect(interactions).toEqual([NPC]);
  });

  it("applies numeric camera-zoom events until the scene shuts down", () => {
    const { camera, shutdown } = enter({ interiorMapId: ROOM.id });
    const zoom = (detail?: unknown) => window.dispatchEvent(new CustomEvent(CAMERA_ZOOM_EVENT, { detail }));
    camera.setZoom.mockClear();

    zoom({ zoom: 0.2 });
    zoom({ zoom: "big" });
    zoom();
    expect(camera.setZoom.mock.calls).toEqual([[0.2]]);

    shutdown();
    zoom({ zoom: 3 });
    expect(camera.setZoom).toHaveBeenCalledTimes(1);
  });
});
