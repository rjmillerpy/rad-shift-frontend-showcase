import * as Phaser from "phaser";
import {
  CAMERA_DEADZONE_HEIGHT_PX,
  CAMERA_DEADZONE_WIDTH_PX,
  CAMERA_LERP,
  CAMERA_ZOOM,
  CAMERA_ZOOM_EVENT,
  DIALOGUE_CLOSE_EVENT,
  DIALOGUE_OPEN_EVENT,
} from "../data/constants";
import type { KeysDown } from "../systems/movement";

/** Input, camera and window-event plumbing shared by every walkable scene
    (the town, AmbleScene, and building interiors, InteriorScene). Each
    listener removes itself when the scene shuts down. */

export type MovementKeys = {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  /** E: talk to / enter whatever is in front of the avatar. */
  interactKey: Phaser.Input.Keyboard.Key;
  /** Shift: the dash modifier (the town uses it). */
  shiftKey: Phaser.Input.Keyboard.Key;
};

/** Arrow keys and WASD both move; null when the scene has no keyboard. */
export function createMovementKeys(scene: Phaser.Scene): MovementKeys | null {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return null;
  const { KeyCodes } = Phaser.Input.Keyboard;
  return {
    cursors: keyboard.createCursorKeys(),
    wasd: {
      W: keyboard.addKey(KeyCodes.W),
      A: keyboard.addKey(KeyCodes.A),
      S: keyboard.addKey(KeyCodes.S),
      D: keyboard.addKey(KeyCodes.D),
    },
    interactKey: keyboard.addKey(KeyCodes.E),
    shiftKey: keyboard.addKey(KeyCodes.SHIFT),
  };
}

export function keysDown({ cursors, wasd }: Pick<MovementKeys, "cursors" | "wasd">): KeysDown {
  return {
    left: cursors.left.isDown || wasd.A.isDown,
    right: cursors.right.isDown || wasd.D.isDown,
    up: cursors.up.isDown || wasd.W.isDown,
    down: cursors.down.isDown || wasd.S.isDown,
  };
}

type Bounds = { x: number; y: number; width: number; height: number };

/** The main camera follows the avatar inside the map's bounds. */
export function followWithCamera(scene: Phaser.Scene, bounds: Bounds, target: Phaser.GameObjects.GameObject): void {
  const cam = scene.cameras.main;
  cam.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
  cam.setZoom(CAMERA_ZOOM);
  cam.startFollow(target, true, CAMERA_LERP, CAMERA_LERP);
  cam.setDeadzone(CAMERA_DEADZONE_WIDTH_PX, CAMERA_DEADZONE_HEIGHT_PX);
}

/** Add window listeners for the scene's lifetime. */
function listenUntilShutdown(scene: Phaser.Scene, listeners: Record<string, EventListener>): void {
  if (typeof window === "undefined") return;
  for (const [type, listener] of Object.entries(listeners)) window.addEventListener(type, listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const [type, listener] of Object.entries(listeners)) window.removeEventListener(type, listener);
  });
}

/** The floating debug button's zoom changes, applied to the main camera. */
export function listenForZoom(scene: Phaser.Scene): void {
  listenUntilShutdown(scene, {
    [CAMERA_ZOOM_EVENT]: (event: Event) => {
      const zoom = (event as CustomEvent<{ zoom?: number }>).detail?.zoom;
      if (typeof zoom === "number") scene.cameras.main.setZoom(zoom);
    },
  });
}

/** The React dialogue frame opening and closing (movement pauses while it's open). */
export function listenForDialogue(scene: Phaser.Scene, onChange: (open: boolean) => void): void {
  listenUntilShutdown(scene, {
    [DIALOGUE_OPEN_EVENT]: () => onChange(true),
    [DIALOGUE_CLOSE_EVENT]: () => onChange(false),
  });
}
