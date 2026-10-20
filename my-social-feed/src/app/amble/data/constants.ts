/**
 * Single source of truth for every magic number in the Amble feed (rules 8, 16).
 * Anything the scenes, hooks, and UI need at runtime lives here.
 */

// ── Phaser scene identifiers ────────────────────────────────────────────────
export const SCENE_KEYS = {
  BOOT: "boot",
  AMBLE: "amble",
  INTERIOR: "amble-interior",
} as const;
export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];

// ── Canvas geometry ─────────────────────────────────────────────────────────
export const PHASER_WIDTH_PX = 960;
export const PHASER_HEIGHT_PX = 640;
export const CANVAS_BG_COLOR = "#f4efe4";

// ── Placeholder avatar (before real sprite art lands in Phase 1.1) ──────────
// Deliberately smaller than a world tile so the avatar reads as a person
// walking around, not a block occupying a whole street tile.
export const PLACEHOLDER_TILE_SIZE_PX = 16;
export const PLACEHOLDER_AVATAR_COLOR = 0x21b364;
export const AVATAR_SPAWN_X_PX = PHASER_WIDTH_PX / 2;
export const AVATAR_SPAWN_Y_PX = PHASER_HEIGHT_PX / 2;

// ── Camera behaviour ───────────────────────────────────────────────────────
export const CAMERA_LERP = 0.15;                    // 0..1 — how snappy the follow is
export const CAMERA_DEADZONE_WIDTH_PX = 120;        // player can drift within this box
export const CAMERA_DEADZONE_HEIGHT_PX = 80;
// Zoom > 1 shrinks the visible slice so the town feels bigger than the canvas
// — Onett / BS-X wander-cadence. At 2× on a 960×640 canvas we show ~15×10
// tiles at a time even though the whole map is 60×45.
export const CAMERA_ZOOM = 2;
// Testing/debug zoom — fits the full 80×100-tile map inside the 960×640
// canvas vertically (640 / (100 × 32) = 0.2). Toggled by the floating
// zoom button; will be removed before release.
export const CAMERA_ZOOM_OVERVIEW = 0.2;
// Custom DOM event name the floating zoom button dispatches; AmbleScene
// listens for it and calls setZoom() on the main camera. Kept as a
// constant so the button and scene can't drift out of sync.
export const CAMERA_ZOOM_EVENT = "amble:setCameraZoom" as const;
// Toggle event for the debug coordinate-axis overlay. React button flips
// visibility; scene reads the `visible` bool from the event detail. Same
// pattern as CAMERA_ZOOM_EVENT.
export const COORDINATE_AXES_TOGGLE_EVENT = "amble:setCoordinateAxes" as const;
// Whether the coord overlay starts visible. Default off — most sessions
// don't need it — but it can be toggled on with the button.
export const COORDINATE_AXES_DEFAULT_VISIBLE = false;

// ── Interaction (Phase 1.3, MOVE-02..MOVE-05) ──────────────────────────────
// Custom DOM events wire the Phaser scene (input + adjacency detection)
// to the React dialogue UI. Same pattern as CAMERA_ZOOM_EVENT — no shared
// refs, no context — so the scene and the UI can't drift out of sync.
export const INTERACT_EVENT = "amble:interact" as const;         // scene → UI: open dialogue for id
export const INTERACT_HINT_EVENT = "amble:interactHint" as const; // scene → UI: adjacent entity changed
export const DIALOGUE_OPEN_EVENT = "amble:dialogueOpen" as const;  // UI → scene: pause movement
export const DIALOGUE_CLOSE_EVENT = "amble:dialogueClose" as const; // UI → scene: resume movement
// Text shown in the HUD prompt when an interactable is adjacent. Keys that
// trigger interact are handled inside AmbleScene (E, Enter).
export const INTERACT_HINT_LABEL = "Press E to interact";

// ── Engagement (Phase 1.5, ENGAGE-01/02) ───────────────────────────────────
// Fires from the dialogue-frame action bar whenever the player likes,
// reposts, or saves the currently-visible post. The HUD listens for it to
// bump the session engagement counter. Same custom-DOM-event pattern as
// the interaction wiring above.
export const AMBLE_ENGAGEMENT_EVENT = "amble:engagement" as const;

// ── Entity-anchor debug rendering (removed once real sprites land) ─────────
export const ENTITY_MARKER_COLORS: Record<string, number> = {
  npc: 0xf9c74f,
  sign: 0xf3722c,
  building: 0x577590,
  object: 0x9b5de5,
};
export const ENTITY_MARKER_SIZE_PX = 10;

// ── Enterable-building marker (Phase 2.1) ───────────────────────────────────
// Buildings whose EntityAnchor declares an `interiorMapId` need to be
// visibly distinct on the overworld so the player knows which storefronts
// they can walk into. Painted as a bright-yellow "door" square filling
// the anchor's tile, with a dark border so it reads clearly against any
// shop tile colour. Phase 1.6 replaces this with a proper door sprite.
export const DOOR_MARKER_FILL = 0xf6c453;   // warm yellow — reads as light spilling out
export const DOOR_MARKER_BORDER = 0x2b2018; // dark brown frame
export const DOOR_MARKER_BORDER_WIDTH_PX = 2;
export const DOOR_MARKER_SIZE_PX = 24;       // slightly smaller than a full 32px tile
// Small floating text label above enterable doors so the intent is
// unmistakable even at the 0.2× zoom-out preview.
export const DOOR_MARKER_LABEL = "ENTER";
export const DOOR_MARKER_LABEL_COLOR = "#2b2018";
export const DOOR_MARKER_LABEL_BG = "#f6c453";
export const DOOR_MARKER_LABEL_FONT_SIZE_PX = 8;

// ── Movement ────────────────────────────────────────────────────────────────
export const AVATAR_SPEED_PX_PER_S = 180;
export const MS_PER_SECOND = 1000;

// ── Dash (Phase 1.3b — MOVE-01 side branch) ─────────────────────────────────
// Shift + a direction triggers a short high-speed burst — think a step or
// two of extra ground on a tap, not a sustained run. After the burst ends,
// a cooldown gates the next dash so it never feels like continuous flight.
export const DASH_MULTIPLIER = 3;         // burst speed = DASH_MULTIPLIER × normal
export const DASH_DURATION_MS = 150;      // how long the burst lasts
export const DASH_COOLDOWN_MS = 500;      // gate after the burst ends

// ── HTTP client (see lib/api.ts) ────────────────────────────────────────────
export const API_TIMEOUT_MS = 8000;
export const API_RETRY_COUNT = 2;
export const API_RETRY_BASE_MS = 300;

// ── Feed switcher card key ──────────────────────────────────────────────────
export const AMBLE_FEED_KEY = "amble";
export const AMBLE_ROUTE = "/amble";
export const LOGIN_REDIRECT_URL = "/login?redirect=/amble";

// Must stay in sync with the key `useAuth` writes to (rule 16).
export const AUTH_TOKEN_STORAGE_KEY = "token";

// ── UI copy ─────────────────────────────────────────────────────────────────
export const LOADING_MESSAGE = "Loading the world…";
export const BOOTSTRAP_ERROR_MESSAGE = "Failed to load the world";
