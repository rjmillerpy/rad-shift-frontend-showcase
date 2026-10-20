/**
 * sceneControls against a fake of the few Phaser services it touches (the
 * keyboard plugin, the main camera, the scene event emitter). Keys and the
 * emitter are real Phaser objects.
 */
import * as Phaser from "phaser";
import {
  createMovementKeys,
  followWithCamera,
  keysDown,
  listenForDialogue,
  listenForZoom,
} from "@/app/amble/scenes/sceneControls";
import {
  CAMERA_ZOOM,
  CAMERA_ZOOM_EVENT,
  DIALOGUE_CLOSE_EVENT,
  DIALOGUE_OPEN_EVENT,
} from "@/app/amble/data/constants";

const { KeyCodes } = Phaser.Input.Keyboard;

function fakeScene({ keyboard = true } = {}) {
  const keys = new Map<number, Phaser.Input.Keyboard.Key>();
  const key = (code: number) => {
    if (!keys.has(code)) keys.set(code, new Phaser.Input.Keyboard.Key(null as never, code));
    return keys.get(code) as Phaser.Input.Keyboard.Key;
  };
  const camera = { setBounds: jest.fn(), setZoom: jest.fn(), startFollow: jest.fn(), setDeadzone: jest.fn() };
  const events = new Phaser.Events.EventEmitter();
  const scene = {
    input: {
      keyboard: keyboard
        ? {
            addKey: key,
            createCursorKeys: () => ({
              up: key(KeyCodes.UP), down: key(KeyCodes.DOWN), left: key(KeyCodes.LEFT), right: key(KeyCodes.RIGHT),
            }),
          }
        : null,
    },
    cameras: { main: camera },
    events,
  } as unknown as Phaser.Scene;
  const press = (code: number) => key(code).onDown(new KeyboardEvent("keydown"));
  return { scene, camera, events, press };
}

describe("createMovementKeys", () => {
  it("is null without a keyboard", () => {
    expect(createMovementKeys(fakeScene({ keyboard: false }).scene)).toBeNull();
  });

  it("binds arrows, WASD, E to interact and Shift to dash", () => {
    const keys = createMovementKeys(fakeScene().scene)!;
    expect(keys.wasd.W.keyCode).toBe(KeyCodes.W);
    expect(keys.interactKey.keyCode).toBe(KeyCodes.E);
    expect(keys.shiftKey.keyCode).toBe(KeyCodes.SHIFT);
    expect(keys.cursors.left.keyCode).toBe(KeyCodes.LEFT);
  });
});

describe("keysDown", () => {
  it.each([
    [KeyCodes.LEFT, "left"],
    [KeyCodes.A, "left"],
    [KeyCodes.RIGHT, "right"],
    [KeyCodes.D, "right"],
    [KeyCodes.UP, "up"],
    [KeyCodes.W, "up"],
    [KeyCodes.DOWN, "down"],
    [KeyCodes.S, "down"],
  ])("key %i moves %s", (code, direction) => {
    const { scene, press } = fakeScene();
    const keys = createMovementKeys(scene)!;
    press(code);
    expect(keysDown(keys)).toEqual({ left: false, right: false, up: false, down: false, [direction]: true });
  });
});

describe("followWithCamera", () => {
  it("bounds the camera to the map, zooms and follows the target", () => {
    const { scene, camera } = fakeScene();
    const target = {} as Phaser.GameObjects.GameObject;
    followWithCamera(scene, { x: 1, y: 2, width: 300, height: 400 }, target);
    expect(camera.setBounds).toHaveBeenCalledWith(1, 2, 300, 400);
    expect(camera.setZoom).toHaveBeenCalledWith(CAMERA_ZOOM);
    expect(camera.startFollow).toHaveBeenCalledWith(target, true, expect.any(Number), expect.any(Number));
  });
});

describe("listenForZoom", () => {
  it("applies a numeric zoom, ignores anything else, and stops at shutdown", () => {
    const { scene, camera, events } = fakeScene();
    listenForZoom(scene);
    window.dispatchEvent(new CustomEvent(CAMERA_ZOOM_EVENT, { detail: { zoom: 2 } }));
    window.dispatchEvent(new CustomEvent(CAMERA_ZOOM_EVENT, { detail: { zoom: "big" } }));
    expect(camera.setZoom).toHaveBeenCalledTimes(1);
    expect(camera.setZoom).toHaveBeenCalledWith(2);
    events.emit(Phaser.Scenes.Events.SHUTDOWN);
    window.dispatchEvent(new CustomEvent(CAMERA_ZOOM_EVENT, { detail: { zoom: 3 } }));
    expect(camera.setZoom).toHaveBeenCalledTimes(1);
  });
});

describe("listenForDialogue", () => {
  it("reports open and close, and stops at shutdown", () => {
    const { scene, events } = fakeScene();
    const onChange = jest.fn();
    listenForDialogue(scene, onChange);
    window.dispatchEvent(new Event(DIALOGUE_OPEN_EVENT));
    window.dispatchEvent(new Event(DIALOGUE_CLOSE_EVENT));
    expect(onChange.mock.calls).toEqual([[true], [false]]);
    events.emit(Phaser.Scenes.Events.SHUTDOWN);
    window.dispatchEvent(new Event(DIALOGUE_OPEN_EVENT));
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
