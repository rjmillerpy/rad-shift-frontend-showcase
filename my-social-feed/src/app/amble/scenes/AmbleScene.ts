import * as Phaser from "phaser";
import {
  AVATAR_SPAWN_X_PX,
  AVATAR_SPAWN_Y_PX,
  COORDINATE_AXES_DEFAULT_VISIBLE,
  COORDINATE_AXES_TOGGLE_EVENT,
  DOOR_MARKER_BORDER,
  DOOR_MARKER_BORDER_WIDTH_PX,
  DOOR_MARKER_FILL,
  DOOR_MARKER_LABEL,
  DOOR_MARKER_LABEL_BG,
  DOOR_MARKER_LABEL_COLOR,
  DOOR_MARKER_LABEL_FONT_SIZE_PX,
  DOOR_MARKER_SIZE_PX,
  ENTITY_MARKER_COLORS,
  ENTITY_MARKER_SIZE_PX,
  INTERACT_EVENT,
  INTERACT_HINT_EVENT,
  PLACEHOLDER_AVATAR_COLOR,
  PLACEHOLDER_TILE_SIZE_PX,
  SCENE_KEYS,
} from "../data/constants";
import { TOWN } from "../data/town";
import { TILE_COLORS, TILE_IDS, type TileId } from "../data/tileset";
import type { EntityAnchor, MapManifest } from "../data/schema";
import { isAvatarBoxBlocked } from "../systems/collision";
import { RoamingNpcSystem } from "../systems/roamingNpcs";
import { createMovementKeys, followWithCamera, keysDown, listenForDialogue, listenForZoom } from "./sceneControls";
import {
  dashStepPixels,
  directionFromKeys,
  initialDashState,
  isDashActive,
  moveWithCollision,
  stepPixels,
  tryStartDash,
  type DashState,
} from "../systems/movement";
import {
  findInteractableEntity,
  tileFromPixel,
  updateFacing,
  type Facing,
} from "../systems/interaction";

const AVATAR_HALF_SIZE_PX = PLACEHOLDER_TILE_SIZE_PX / 2;

/** The world scene. Loads the town's map (data/town.ts), paints each tile as a
    coloured rectangle (placeholder for the real tileset in Phase 1.6),
    spawns the placeholder avatar, and configures a follow-camera bounded
    by the map. All movement / collision math lives in `systems/` so this
    class stays thin (rules 7, 60). */
export class AmbleScene extends Phaser.Scene {
  private map: MapManifest = TOWN.map;
  private avatar!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private dashState: DashState = initialDashState();
  private facing: Facing = "south";
  private adjacentEntityId: string | null = null;
  private dialogueOpen = false;

  // Phase 2.1 — when returning from an interior scene, InteriorScene
  // passes back the pixel position the player was at before entering.
  // The scene resets these to null after applying so a normal fresh
  // load still uses the default spawn.
  private returnSpawnX: number | null = null;
  private returnSpawnY: number | null = null;

  constructor() {
    super({ key: SCENE_KEYS.AMBLE });
  }


  init(data?: { returnSpawnX?: number; returnSpawnY?: number }): void {
    this.returnSpawnX = data?.returnSpawnX ?? null;
    this.returnSpawnY = data?.returnSpawnY ?? null;
    // Fresh scene start — Phaser reuses instances, so wipe interaction
    // state that would otherwise leak from the previous run.
    this.adjacentEntityId = null;
    this.dialogueOpen = false;
    this.facing = "south";
    this.dashState = initialDashState();
  }

  create(): void {
    this.drawGroundLayer();
    this.drawCoordinateAxes();
    this.drawEntityAnchors();
    this.avatar = this.createAvatar();
    this.configureCamera();
    this.bindInput();
    this.bindZoomEvent();
    this.bindCoordinateAxesEvent();
    this.bindDialogueEvents();
    // Ambient roamer system spins up once the scene is fully drawn —
    // update loop feeds it delta ms + the same collision predicate the
    // player uses, so roamers walk around buildings/water like the
    // avatar does.
    this.roamingNpcs = new RoamingNpcSystem(this, this.map, { parkBounds: TOWN.parkBounds });
  }

  /** Zoom changes from the floating debug button. */
  private bindZoomEvent(): void {
    listenForZoom(this);
  }

  update(time: number, deltaMs: number): void {
    if (!this.avatar || !this.cursors) return;

    // MOVE-04 pause: while the dialogue frame is open we still poll the
    // interact key so pressing it a second time closes the frame (handled
    // inside DialogueFrame), but avatar movement is frozen.
    if (!this.dialogueOpen) {
      const direction = directionFromKeys(keysDown({ cursors: this.cursors, wasd: this.wasd }));
      const hasDirection = direction.dx !== 0 || direction.dy !== 0;

      // Phase 1.3b — Shift press triggers a dash burst (short high-speed
      // window then a cooldown before the next dash is allowed). Pure
      // state helpers own the timing math; the scene only decides when
      // to feed them the current wall-clock time.
      if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
        this.dashState = tryStartDash(this.dashState, time, hasDirection);
      }

      if (hasDirection) {
        this.facing = updateFacing(this.facing, direction);
        const stepPx = isDashActive(this.dashState, time)
          ? dashStepPixels(deltaMs)
          : stepPixels(deltaMs);
        const next = moveWithCollision(
          { x: this.avatar.x, y: this.avatar.y },
          direction,
          stepPx,
          // Composed predicate: map collision + roamer collision. Player
          // now bumps against wanderers instead of walking through them.
          // Roamers' own movement predicate stays map-only so the crowd
          // doesn't jam up on each other or on the player.
          (x, y) =>
            isAvatarBoxBlocked(this.map, x, y, AVATAR_HALF_SIZE_PX) ||
            (this.roamingNpcs?.isBlockedByRoamer(x, y, AVATAR_HALF_SIZE_PX) ?? false),
        );
        this.avatar.x = next.x;
        this.avatar.y = next.y;
      }
    }

    this.updateInteractHint();
    this.pollInteractKey();

    // Ambient roamer tick — moves + spawns + despawns are independent
    // of the dialogue-open pause; town keeps living while the player
    // reads a post.
    if (this.roamingNpcs) {
      this.roamingNpcs.update(
        deltaMs,
        (x, y) => isAvatarBoxBlocked(this.map, x, y, AVATAR_HALF_SIZE_PX),
      );
    }
  }

  /** Recompute the adjacent entity each frame and, when it changes, notify
      the HUD so the "Press E" prompt appears / disappears. Kept per-frame
      rather than event-driven because the source of truth (avatar tile) is
      updated per frame anyway. */
  private updateInteractHint(): void {
    const { tileX, tileY } = tileFromPixel(
      this.avatar.x,
      this.avatar.y,
      this.map.tileWidth,
    );
    // Roamers are wired into the interaction pipeline as ambient anchors
    // that snapshot their current tile each frame. Static map entities
    // still win when both a roamer and an anchor share a tile (Array
    // spread order — map.entities first).
    const searchable = this.roamingNpcs
      ? [...this.map.entities, ...this.roamingNpcs.getInteractableEntities()]
      : this.map.entities;
    const entity = findInteractableEntity(
      tileX,
      tileY,
      this.facing,
      searchable,
    );
    const nextId = entity ? entity.id : null;
    if (nextId !== this.adjacentEntityId) {
      this.adjacentEntityId = nextId;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(INTERACT_HINT_EVENT, {
            detail: { entityId: nextId },
          }),
        );
      }
    }
  }

  /** MOVE-03: E (or Enter) opens the dialogue frame if an entity is
      adjacent. Phase 2.1: if the entity is a building with an
      `interiorMapId`, transition to the InteriorScene instead of
      opening the dialogue. */
  private pollInteractKey(): void {
    if (this.dialogueOpen) return;
    if (!Phaser.Input.Keyboard.JustDown(this.interactKey)) return;
    if (!this.adjacentEntityId) return;
    // Static entities first; if not found, check current roamer snapshot
    // (the id might belong to a wanderer standing on the adjacent tile).
    let entity: EntityAnchor | undefined = this.map.entities.find(
      (e) => e.id === this.adjacentEntityId,
    );
    if (!entity && this.roamingNpcs) {
      entity = this.roamingNpcs
        .getInteractableEntities()
        .find((e) => e.id === this.adjacentEntityId);
    }
    if (!entity) return;
    if (entity.interiorMapId) {
      // Enter building. Pass the player's current pixel position so
      // InteriorScene can hand it back on exit.
      this.scene.start(SCENE_KEYS.INTERIOR, {
        interiorMapId: entity.interiorMapId,
        returnSpawnX: this.avatar.x,
        returnSpawnY: this.avatar.y,
      });
      return;
    }
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(INTERACT_EVENT, { detail: { entity } }),
    );
  }

  // ── Rendering ────────────────────────────────────────────────────────────
  private drawGroundLayer(): void {
    const { tileWidth, tileHeight, layers, height, width } = this.map;
    // Batched overlay collections — every "textured" tile pushes its
    // coord into one of these lists so we can stamp all details in a
    // small number of Graphics passes after the tile-rect loop.
    const trackCells: Array<{ x: number; y: number }> = [];
    const brickCells: Array<{ x: number; y: number }> = [];
    const sidingCells: Array<{ x: number; y: number }> = [];
    const stoneCells: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tileId = layers.ground[y][x] as TileId;
        const color = TILE_COLORS[tileId];
        if (color === undefined) continue;
        const tile = this.add.rectangle(
          x * tileWidth + tileWidth / 2,
          y * tileHeight + tileHeight / 2,
          tileWidth,
          tileHeight,
          Phaser.Display.Color.HexStringToColor(color).color,
        );
        // Train tracks render above avatars/roamers (walk under the
        // trestle) at reduced alpha so the "you go underneath" reads
        // clearly. The train CAR itself layers even higher, at full
        // opacity — it should look solid even though you can walk
        // through the same cells (TRAIN + TRAIN_BLUE removed from
        // BLOCKED_TILE_IDS in tileset.ts).
        if (tileId === TILE_IDS.TRAIN_TRACK) {
          tile.setDepth(25);
          tile.setAlpha(0.6);
        } else if (
          tileId === TILE_IDS.TRAIN ||
          tileId === TILE_IDS.TRAIN_BLUE
        ) {
          tile.setDepth(27);
          tile.setAlpha(1);
        }
        if (tileId === TILE_IDS.TRAIN_TRACK) {
          trackCells.push({ x, y });
        } else if (tileId === TILE_IDS.BUILDING_COMMERCIAL) {
          brickCells.push({ x, y });
        } else if (tileId === TILE_IDS.BUILDING_RESIDENTIAL) {
          sidingCells.push({ x, y });
        } else if (tileId === TILE_IDS.BUILDING_MUNICIPAL) {
          stoneCells.push({ x, y });
        }
      }
    }
    this.drawTrackDetails(trackCells, tileWidth, tileHeight);
    this.drawBuildingTextures(brickCells, sidingCells, stoneCells, tileWidth, tileHeight);
  }


  /**
   * Per-tile texture overlays for the three building tile classes, so
   * commercial (brick), residential (clapboard siding), and municipal
   * (stone) buildings each read visually distinct — same idea as the
   * rail + tie pass but for walls. All three collections stamp into a
   * single Graphics object for cheap rendering (~200 tiles → 1 draw).
   *
   * Depths are chosen so the texture sits just above the flat tile fill
   * (depth 0) but under roamers (20), avatars, entity markers, and the
   * track overlay (25/26). Alpha kept low so the pattern reads as a
   * subtle texture, not stripes.
   */
  private drawBuildingTextures(
    brickCells: ReadonlyArray<{ x: number; y: number }>,
    sidingCells: ReadonlyArray<{ x: number; y: number }>,
    stoneCells: ReadonlyArray<{ x: number; y: number }>,
    tileWidth: number,
    tileHeight: number,
  ): void {
    if (
      brickCells.length === 0 &&
      sidingCells.length === 0 &&
      stoneCells.length === 0
    ) {
      return;
    }
    const g = this.add.graphics();
    g.setDepth(1);
    g.setAlpha(0.32);
    // ── Brick (commercial): 3 horizontal mortar courses + staggered
    // vertical joints per tile. Even-y rows offset by half a brick so
    // adjacent tiles tile up to a proper running-bond pattern.
    g.lineStyle(1, 0x1a0f08, 1);
    const courseCount = 3;
    for (const cell of brickCells) {
      const x0 = cell.x * tileWidth;
      const y0 = cell.y * tileHeight;
      for (let i = 1; i < courseCount; i += 1) {
        const py = y0 + (i * tileHeight) / courseCount;
        g.beginPath();
        g.moveTo(x0, py);
        g.lineTo(x0 + tileWidth, py);
        g.strokePath();
      }
      // Vertical joints per course. Even-row tiles start joints at
      // 1/2 tile; odd-row tiles at 0 and full tile width, so the two
      // halves interlock across neighbouring tiles.
      const oddRow = (cell.y % 2) === 1;
      for (let i = 0; i < courseCount; i += 1) {
        const courseTop = y0 + (i * tileHeight) / courseCount;
        const courseBot = y0 + ((i + 1) * tileHeight) / courseCount;
        const courseIsOffset = (i % 2 === 0) !== oddRow;
        const jointX = courseIsOffset ? x0 + tileWidth / 2 : x0;
        g.beginPath();
        g.moveTo(jointX, courseTop);
        g.lineTo(jointX, courseBot);
        g.strokePath();
        // Second joint at other side so runs of tiles show two joints
        // per course rather than one lonely stripe.
        const jointX2 = courseIsOffset ? x0 : x0 + tileWidth / 2;
        g.beginPath();
        g.moveTo(jointX2, courseTop);
        g.lineTo(jointX2, courseBot);
        g.strokePath();
      }
    }
    // ── Clapboard siding (residential): 4 thin horizontal lines per
    // tile so a stack of tiles reads as horizontal wood siding boards.
    g.lineStyle(1, 0x2a1a10, 1);
    const boardCount = 4;
    for (const cell of sidingCells) {
      const x0 = cell.x * tileWidth;
      const y0 = cell.y * tileHeight;
      for (let i = 1; i < boardCount; i += 1) {
        const py = y0 + (i * tileHeight) / boardCount;
        g.beginPath();
        g.moveTo(x0, py);
        g.lineTo(x0 + tileWidth, py);
        g.strokePath();
      }
    }
    // ── Stone (municipal): 2 courses per tile with staggered vertical
    // breaks so runs read as ashlar-style masonry.
    g.lineStyle(1, 0x2e2418, 1);
    for (const cell of stoneCells) {
      const x0 = cell.x * tileWidth;
      const y0 = cell.y * tileHeight;
      const midY = y0 + tileHeight / 2;
      g.beginPath();
      g.moveTo(x0, midY);
      g.lineTo(x0 + tileWidth, midY);
      g.strokePath();
      const oddParity = ((cell.x + cell.y) % 2) === 1;
      const topJoint = oddParity ? tileWidth * 0.35 : tileWidth * 0.65;
      const botJoint = oddParity ? tileWidth * 0.7 : tileWidth * 0.3;
      g.beginPath();
      g.moveTo(x0 + topJoint, y0);
      g.lineTo(x0 + topJoint, midY);
      g.strokePath();
      g.beginPath();
      g.moveTo(x0 + botJoint, midY);
      g.lineTo(x0 + botJoint, y0 + tileHeight);
      g.strokePath();
    }
  }

  /**
   * Overlay rail + tie graphics on every TRAIN_TRACK cell so the tracks
   * read as actual railway art instead of a solid brown band.
   *
   * Track direction is NW→SE (slope 1). Two parallel rails (steel-grey
   * diagonals offset perpendicular to travel) and short perpendicular
   * ties per tile — the pattern reads as continuous rails and ties
   * across the whole track brush.
   */
  private drawTrackDetails(
    trackCells: ReadonlyArray<{ x: number; y: number }>,
    tileWidth: number,
    tileHeight: number,
  ): void {
    if (trackCells.length === 0) return;
    const graphics = this.add.graphics();
    graphics.setDepth(26); // just above the semi-transparent track tiles
    graphics.setAlpha(0.85);
    const railOffset = tileWidth * 0.22;
    const tieHalfLen = tileWidth * 0.32;
    const invSqrt2 = 1 / Math.SQRT2;
    // The 2-tile Bresenham brush produces THREE stacked rail levels
    // (primary line + upper offset + lower offset). Filter to only
    // draw rails on the primary-line cells — the ones where the Bresenham
    // step LANDS. For our slope-1 track from (1, 14), primary cells
    // satisfy (x + y) % 2 === 1 (same parity as start's 1 + 14 = 15).
    // Result: exactly two parallel rails across the whole track brush.
    const TRACK_PRIMARY_XY_PARITY = 1;
    for (const cell of trackCells) {
      if (((cell.x + cell.y) & 1) !== TRACK_PRIMARY_XY_PARITY) continue;
      const x0 = cell.x * tileWidth;
      const y0 = cell.y * tileHeight;
      const x1 = x0 + tileWidth;
      const y1 = y0 + tileHeight;
      graphics.lineStyle(1.4, 0x2d2018, 1);
      const rail1Ox = railOffset * invSqrt2;
      const rail1Oy = -railOffset * invSqrt2;
      graphics.beginPath();
      graphics.moveTo(x0 + rail1Ox, y0 + rail1Oy);
      graphics.lineTo(x1 + rail1Ox, y1 + rail1Oy);
      graphics.strokePath();
      graphics.beginPath();
      graphics.moveTo(x0 - rail1Ox, y0 - rail1Oy);
      graphics.lineTo(x1 - rail1Ox, y1 - rail1Oy);
      graphics.strokePath();
      graphics.lineStyle(2.2, 0x1a1109, 1);
      for (const t of [0.15, 0.5, 0.85]) {
        const px = x0 + t * tileWidth;
        const py = y0 + t * tileHeight;
        const perpX = -tieHalfLen * invSqrt2;
        const perpY = tieHalfLen * invSqrt2;
        graphics.beginPath();
        graphics.moveTo(px + perpX, py + perpY);
        graphics.lineTo(px - perpX, py - perpY);
        graphics.strokePath();
      }
    }
  }

  // Grouped so we can flip visibility as one unit when the coord toggle
  // button fires. Independent of camera zoom — driven purely by the
  // COORDINATE_AXES_TOGGLE_EVENT.
  private coordinateAxes: Phaser.GameObjects.Group | null = null;
  private axesToggleListener?: (event: Event) => void;
  private roamingNpcs: RoamingNpcSystem | null = null;

  /**
   * Debug overlay — cyan grid every 5 tiles, plus `col,row` labels at
   * every 10-tile intersection SCATTERED THROUGHOUT the map (not just
   * on the border). This means wherever the camera happens to be, there
   * are labels visible in-frame. Hidden when zoomed in past
   * AXIS_VISIBLE_MAX_ZOOM so the HUD stays clean during gameplay.
   */
  private drawCoordinateAxes(): void {
    const { tileWidth, tileHeight, width, height } = this.map;
    const AXIS_COLOR = 0x2be0e0;
    const LINE_ALPHA = 0.6;
    const LABEL_COLOR = "#000000";
    const LABEL_BG = "#ffff33";
    const FONT_SIZE = 10;
    const gridStep = 5;
    const labelStep = 10;
    const group = this.add.group();
    for (let x = 0; x <= width; x += gridStep) {
      const line = this.add
        .line(0, 0, x * tileWidth, 0, x * tileWidth, height * tileHeight, AXIS_COLOR)
        .setOrigin(0, 0)
        .setAlpha(LINE_ALPHA)
        .setDepth(49);
      group.add(line);
    }
    for (let y = 0; y <= height; y += gridStep) {
      const line = this.add
        .line(0, 0, 0, y * tileHeight, width * tileWidth, y * tileHeight, AXIS_COLOR)
        .setOrigin(0, 0)
        .setAlpha(LINE_ALPHA)
        .setDepth(49);
      group.add(line);
    }
    // Scattered `col,row` labels at every 10-tile intersection across
    // the map, so any camera view sees at least one.
    for (let y = 0; y <= height; y += labelStep) {
      for (let x = 0; x <= width; x += labelStep) {
        const label = this.add.text(
          x * tileWidth + 1,
          y * tileHeight + 1,
          `${x},${y}`,
          {
            fontSize: `${FONT_SIZE}px`,
            color: LABEL_COLOR,
            backgroundColor: LABEL_BG,
            fontStyle: "bold",
            padding: { left: 2, right: 2, top: 1, bottom: 1 },
          },
        );
        label.setDepth(50);
        group.add(label);
      }
    }
    this.coordinateAxes = group;
    this.setCoordinateAxesVisibility(COORDINATE_AXES_DEFAULT_VISIBLE);
  }

  private setCoordinateAxesVisibility(visible: boolean): void {
    if (!this.coordinateAxes) return;
    this.coordinateAxes.setVisible(visible);
  }

  private bindCoordinateAxesEvent(): void {
    if (typeof window === "undefined") return;
    this.axesToggleListener = (event: Event) => {
      const detail = (event as CustomEvent<{ visible?: boolean }>).detail;
      if (typeof detail?.visible !== "boolean") return;
      this.setCoordinateAxesVisibility(detail.visible);
    };
    window.addEventListener(COORDINATE_AXES_TOGGLE_EVENT, this.axesToggleListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.axesToggleListener) {
        window.removeEventListener(COORDINATE_AXES_TOGGLE_EVENT, this.axesToggleListener);
      }
    });
  }

  private drawEntityAnchors(): void {
    for (const anchor of this.map.entities) {
      this.drawEntityAnchor(anchor);
    }
  }

  private drawEntityAnchor(anchor: EntityAnchor): void {
    const { tileWidth, tileHeight } = this.map;
    const centerX = anchor.position.tileX * tileWidth + tileWidth / 2;
    const centerY = anchor.position.tileY * tileHeight + tileHeight / 2;
    // Phase 2.1 — enterable buildings get a bright yellow door marker so
    // the player can spot them from across the map. Phase 1.6 will swap
    // this for a real door sprite.
    if (anchor.interiorMapId) {
      this.drawDoorMarker(centerX, centerY);
      return;
    }
    const color = ENTITY_MARKER_COLORS[anchor.type] ?? 0xffffff;
    this.add.circle(centerX, centerY, ENTITY_MARKER_SIZE_PX / 2, color);
  }

  private drawDoorMarker(centerX: number, centerY: number): void {
    // Under the ENTER badge we now paint a proper door — dark wood
    // rectangle taller than wide, thin lighter frame, tiny brass
    // knob. Gives buildings a real "this is a doorway" hit instead of
    // just a coloured square hovering on the facade.
    const doorPanel = this.add.rectangle(
      centerX,
      centerY,
      DOOR_MARKER_SIZE_PX * 0.9,
      DOOR_MARKER_SIZE_PX * 1.15,
      0x4a2a12, // dark stained wood
    );
    doorPanel.setStrokeStyle(1.2, 0x1a0a02);
    // Doorknob — small brass circle on the right-hand side.
    this.add.circle(
      centerX + DOOR_MARKER_SIZE_PX * 0.28,
      centerY + DOOR_MARKER_SIZE_PX * 0.05,
      2,
      0xd7b56d,
    );
    // The bright yellow "enter here" affordance sits ON TOP of the door
    // — slightly smaller than before so both are legible.
    const door = this.add.rectangle(
      centerX,
      centerY,
      DOOR_MARKER_SIZE_PX * 0.55,
      DOOR_MARKER_SIZE_PX * 0.55,
      DOOR_MARKER_FILL,
    );
    door.setStrokeStyle(DOOR_MARKER_BORDER_WIDTH_PX, DOOR_MARKER_BORDER);
    // Label floats above the door so the affordance reads at any zoom.
    this.add
      .text(centerX, centerY - DOOR_MARKER_SIZE_PX * 0.65 - 6, DOOR_MARKER_LABEL, {
        fontSize: `${DOOR_MARKER_LABEL_FONT_SIZE_PX}px`,
        color: DOOR_MARKER_LABEL_COLOR,
        backgroundColor: DOOR_MARKER_LABEL_BG,
        padding: { left: 2, right: 2, top: 1, bottom: 1 },
      })
      .setOrigin(0.5, 1);
  }

  private createAvatar(): Phaser.GameObjects.Rectangle {
    const spawn = this.pickSpawnPosition();
    return this.add.rectangle(
      spawn.x,
      spawn.y,
      PLACEHOLDER_TILE_SIZE_PX,
      PLACEHOLDER_TILE_SIZE_PX,
      PLACEHOLDER_AVATAR_COLOR,
    );
  }

  private pickSpawnPosition(): { x: number; y: number } {
    // Phase 2.1 — if InteriorScene handed us a return position, honour it.
    if (this.returnSpawnX !== null && this.returnSpawnY !== null) {
      const spawn = { x: this.returnSpawnX, y: this.returnSpawnY };
      this.returnSpawnX = null;
      this.returnSpawnY = null;
      if (!isAvatarBoxBlocked(this.map, spawn.x, spawn.y, AVATAR_HALF_SIZE_PX)) {
        return spawn;
      }
    }
    const spawn = { x: AVATAR_SPAWN_X_PX, y: AVATAR_SPAWN_Y_PX };
    if (!isAvatarBoxBlocked(this.map, spawn.x, spawn.y, AVATAR_HALF_SIZE_PX)) {
      return spawn;
    }
    return this.findFirstOpenSpawn();
  }

  /** Fallback: scan tiles for the first walkable cell. Bounded by width×height
      so the loop can't run away (rule 31). */
  private findFirstOpenSpawn(): { x: number; y: number } {
    const { tileWidth, tileHeight, width, height } = this.map;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cx = x * tileWidth + tileWidth / 2;
        const cy = y * tileHeight + tileHeight / 2;
        if (!isAvatarBoxBlocked(this.map, cx, cy, AVATAR_HALF_SIZE_PX)) {
          return { x: cx, y: cy };
        }
      }
    }
    return { x: AVATAR_SPAWN_X_PX, y: AVATAR_SPAWN_Y_PX };
  }

  private configureCamera(): void {
    followWithCamera(this, this.map.cameraBounds, this.avatar);
  }

  private bindInput(): void {
    const keys = createMovementKeys(this);
    if (!keys) return;
    this.cursors = keys.cursors;
    this.wasd = keys.wasd;
    this.interactKey = keys.interactKey;
    // Phase 1.3b dash — Shift is the modifier for a burst step.
    this.shiftKey = keys.shiftKey;
  }

  /** Movement freezes while the React DialogueFrame is open (MOVE-04). */
  private bindDialogueEvents(): void {
    listenForDialogue(this, (open) => { this.dialogueOpen = open; });
  }
}
