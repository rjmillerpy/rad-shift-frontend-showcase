import * as Phaser from "phaser";
import {
  ENTITY_MARKER_COLORS,
  ENTITY_MARKER_SIZE_PX,
  INTERACT_EVENT,
  INTERACT_HINT_EVENT,
  PLACEHOLDER_AVATAR_COLOR,
  PLACEHOLDER_TILE_SIZE_PX,
  SCENE_KEYS,
} from "../data/constants";
import { getInterior } from "../data/maps/interiors/registry";
import { createMovementKeys, followWithCamera, keysDown, listenForDialogue, listenForZoom } from "./sceneControls";
import { TILE_COLORS, type TileId } from "../data/tileset";
import type { EntityAnchor, InteriorMap } from "../data/schema";
import { isAvatarBoxBlocked } from "../systems/collision";
import {
  directionFromKeys,
  moveWithCollision,
  stepPixels,
} from "../systems/movement";
import {
  findInteractableEntity,
  tileFromPixel,
  updateFacing,
  type Facing,
} from "../systems/interaction";

const AVATAR_HALF_SIZE_PX = PLACEHOLDER_TILE_SIZE_PX / 2;

/**
 * Phase 2.1 — the scene for building interiors. Loads a small handcrafted
 * `InteriorMap`, spawns the player on the map's `exitTile`, and uses the
 * same movement/interaction systems as the overworld. When the player
 * interacts standing on the exit tile they're bounced back to AmbleScene
 * at the pixel position they left from.
 *
 * Kept as a separate scene (not a subclass of AmbleScene) so the
 * overworld's specific concerns (map choice, dash, camera behaviour) can
 * evolve independently. Common logic lives in `systems/`.
 */
export class InteriorScene extends Phaser.Scene {
  private interior: InteriorMap | null = null;
  private returnSpawnX: number = 0;
  private returnSpawnY: number = 0;
  // Staircase entry — when non-null, spawn player at (spawnTileX,
  // spawnTileY) instead of the interior's default exitTile. Used when
  // traversing between floors of the same building.
  private spawnOverrideTileX: number | null = null;
  private spawnOverrideTileY: number | null = null;
  private avatar!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private facing: Facing = "north";
  // Tracks what interactable the player is currently on/adjacent to. Entity
  // ids are strings; the two special sentinels use the "__" prefix so they
  // can't collide with any real id.
  private adjacentEntityId: string | null = null;
  private dialogueOpen = false;


  constructor() {
    super({ key: SCENE_KEYS.INTERIOR });
  }

  init(data: {
    interiorMapId: string;
    returnSpawnX: number;
    returnSpawnY: number;
    spawnTileX?: number;
    spawnTileY?: number;
    spawnFacing?: Facing;
  }): void {
    this.interior = getInterior(data.interiorMapId);
    this.returnSpawnX = data.returnSpawnX;
    this.returnSpawnY = data.returnSpawnY;
    this.spawnOverrideTileX = data.spawnTileX ?? null;
    this.spawnOverrideTileY = data.spawnTileY ?? null;
    this.adjacentEntityId = null;
    this.dialogueOpen = false;
    this.facing = data.spawnFacing ?? this.interior?.entryFacing ?? "north";
  }

  create(): void {
    if (!this.interior) {
      // Bad interior id — bounce back to overworld at the return spawn
      // so the player isn't stranded in a black scene.
      this.scene.start(SCENE_KEYS.AMBLE, {
        returnSpawnX: this.returnSpawnX,
        returnSpawnY: this.returnSpawnY,
      });
      return;
    }
    this.drawGroundLayer(this.interior);
    this.drawEntityAnchors(this.interior);
    this.avatar = this.createAvatarAtExit(this.interior);
    this.configureCamera(this.interior);
    this.bindInput();
    this.bindZoomEvent();
    this.bindDialogueEvents();
  }

  update(_time: number, deltaMs: number): void {
    if (!this.avatar || !this.cursors || !this.interior) return;

    if (!this.dialogueOpen) {
      const direction = directionFromKeys(keysDown({ cursors: this.cursors, wasd: this.wasd }));
      if (direction.dx !== 0 || direction.dy !== 0) {
        this.facing = updateFacing(this.facing, direction);
        const interior = this.interior;
        const stepPx = stepPixels(deltaMs);
        const next = moveWithCollision(
          { x: this.avatar.x, y: this.avatar.y },
          direction,
          stepPx,
          (x, y) => isAvatarBoxBlocked(interior, x, y, AVATAR_HALF_SIZE_PX),
        );
        this.avatar.x = next.x;
        this.avatar.y = next.y;
      }
    }

    this.updateInteractHint();
    this.pollInteractKey();
  }

  private updateInteractHint(): void {
    if (!this.interior) return;
    const { tileX, tileY } = tileFromPixel(
      this.avatar.x,
      this.avatar.y,
      this.interior.tileWidth,
    );
    // Staircase check must come BEFORE the exit-tile check. Upper floors
    // set their `exitTile` to the same cell as their downstairs staircase
    // (a sentinel — they don't actually connect to the overworld), so if
    // exit were checked first the down-stair would be shadowed by an
    // overworld-exit branch. Ground-floor interiors don't collide because
    // their staircase up sits away from the south door.
    // Single-floor interiors don't set the `staircases` field on their
    // export object — the Zod default only fires when parsing through
    // the schema, and our maps are plain literals cast to InteriorMap.
    // Coerce to [] here so the runtime doesn't crash.
    const stairs = this.interior.staircases ?? [];
    const stairIdx = stairs.findIndex(
      (s) => s.tileX === tileX && s.tileY === tileY,
    );
    if (stairIdx >= 0) {
      const sentinel = `__stair_${stairIdx}__`;
      if (this.adjacentEntityId !== sentinel) {
        this.adjacentEntityId = sentinel;
        this.dispatchHint(sentinel);
      }
      return;
    }
    const onExitTile =
      tileX === this.interior.exitTile.tileX &&
      tileY === this.interior.exitTile.tileY;
    if (onExitTile) {
      if (this.adjacentEntityId !== "__exit__") {
        this.adjacentEntityId = "__exit__";
        this.dispatchHint("__exit__");
      }
      return;
    }
    const entity = findInteractableEntity(
      tileX,
      tileY,
      this.facing,
      this.interior.entities,
    );
    const nextId = entity ? entity.id : null;
    if (nextId !== this.adjacentEntityId) {
      this.adjacentEntityId = nextId;
      this.dispatchHint(nextId);
    }
  }

  private dispatchHint(id: string | null): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(INTERACT_HINT_EVENT, { detail: { entityId: id } }),
    );
  }

  private pollInteractKey(): void {
    if (this.dialogueOpen) return;
    if (!Phaser.Input.Keyboard.JustDown(this.interactKey)) return;
    if (!this.adjacentEntityId || !this.interior) return;
    if (this.adjacentEntityId === "__exit__") {
      // Exit back to overworld at the pixel position the player entered from.
      this.dispatchHint(null);
      this.scene.start(SCENE_KEYS.AMBLE, {
        returnSpawnX: this.returnSpawnX,
        returnSpawnY: this.returnSpawnY,
      });
      return;
    }
    const stairMatch = /^__stair_(\d+)__$/.exec(this.adjacentEntityId);
    if (stairMatch) {
      const idx = Number(stairMatch[1]);
      const stair = (this.interior.staircases ?? [])[idx];
      if (!stair) return;
      this.dispatchHint(null);
      this.scene.start(SCENE_KEYS.INTERIOR, {
        interiorMapId: stair.targetMapId,
        returnSpawnX: this.returnSpawnX,
        returnSpawnY: this.returnSpawnY,
        spawnTileX: stair.targetTileX,
        spawnTileY: stair.targetTileY,
        spawnFacing: stair.targetFacing,
      });
      return;
    }
    const entity = this.interior.entities.find((e) => e.id === this.adjacentEntityId);
    if (!entity) return;
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(INTERACT_EVENT, { detail: { entity } }),
    );
  }

  private drawGroundLayer(interior: InteriorMap): void {
    const { tileWidth, tileHeight, layers, height, width } = interior;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tileId = layers.ground[y][x] as TileId;
        const color = TILE_COLORS[tileId];
        if (color === undefined) continue;
        this.add.rectangle(
          x * tileWidth + tileWidth / 2,
          y * tileHeight + tileHeight / 2,
          tileWidth,
          tileHeight,
          Phaser.Display.Color.HexStringToColor(color).color,
        );
      }
    }
  }

  private drawEntityAnchors(interior: InteriorMap): void {
    for (const anchor of interior.entities) {
      this.drawEntityAnchor(interior, anchor);
    }
    // Draw a distinctive marker on the exit tile so the player knows
    // where to interact for exit (Phase 1.6 will replace with a door
    // sprite; for now a green circle).
    const { tileWidth, tileHeight, exitTile } = interior;
    this.add.circle(
      exitTile.tileX * tileWidth + tileWidth / 2,
      exitTile.tileY * tileHeight + tileHeight / 2,
      ENTITY_MARKER_SIZE_PX / 2,
      0x7bc678,
    );
    // Staircase markers — cyan for anything labelled "up"/"upstairs",
    // magenta for anything labelled "down"/"downstairs", white otherwise.
    for (const stair of interior.staircases ?? []) {
      const cx = stair.tileX * tileWidth + tileWidth / 2;
      const cy = stair.tileY * tileHeight + tileHeight / 2;
      const label = (stair.label ?? "").toLowerCase();
      let color = 0xdcdcdc;
      if (label.startsWith("up")) color = 0x58e0e0;
      else if (label.startsWith("down")) color = 0xd05fd0;
      this.add.circle(cx, cy, ENTITY_MARKER_SIZE_PX / 2, color);
    }
  }

  private drawEntityAnchor(interior: InteriorMap, anchor: EntityAnchor): void {
    const { tileWidth, tileHeight } = interior;
    const centerX = anchor.position.tileX * tileWidth + tileWidth / 2;
    const centerY = anchor.position.tileY * tileHeight + tileHeight / 2;
    const color = ENTITY_MARKER_COLORS[anchor.type] ?? 0xffffff;
    this.add.circle(centerX, centerY, ENTITY_MARKER_SIZE_PX / 2, color);
  }

  private createAvatarAtExit(interior: InteriorMap): Phaser.GameObjects.Rectangle {
    const { tileWidth, tileHeight, exitTile } = interior;
    const spawnTileX = this.spawnOverrideTileX ?? exitTile.tileX;
    const spawnTileY = this.spawnOverrideTileY ?? exitTile.tileY;
    const x = spawnTileX * tileWidth + tileWidth / 2;
    const y = spawnTileY * tileHeight + tileHeight / 2;
    return this.add.rectangle(
      x,
      y,
      PLACEHOLDER_TILE_SIZE_PX,
      PLACEHOLDER_TILE_SIZE_PX,
      PLACEHOLDER_AVATAR_COLOR,
    );
  }

  private configureCamera(interior: InteriorMap): void {
    followWithCamera(this, interior.cameraBounds, this.avatar);
  }

  private bindInput(): void {
    const keys = createMovementKeys(this);
    if (!keys) return;
    this.cursors = keys.cursors;
    this.wasd = keys.wasd;
    this.interactKey = keys.interactKey;
  }

  private bindZoomEvent(): void {
    listenForZoom(this);
  }

  private bindDialogueEvents(): void {
    listenForDialogue(this, (open) => { this.dialogueOpen = open; });
  }
}
