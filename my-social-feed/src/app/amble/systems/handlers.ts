/**
 * Interaction handler registry (MOVE-02: extensibility hook so new entity
 * types can be added later without redesign).
 *
 * A "handler" turns an `EntityAnchor` into a `DialogueLine` — what appears
 * in the dialogue frame when the player interacts. Handlers are looked up
 * first by entity id (specific-entity behaviour, e.g. train station's
 * "coming soon" copy for NAV-02), then by entity type (generic per-type
 * fallback, e.g. every NPC that hasn't been given a specific handler
 * says "…").
 *
 * Real content bindings arrive in Phase 1.4 (CONTENT-01..06). Until then
 * every handler here returns a placeholder line — but the plumbing is
 * complete so `1.4` swaps in real INT-01 calls at a single seam.
 */
import type { AmblePost, EntityAnchor, EntityType } from "../data/schema";
import { fetchEntityContent } from "../services/content";

export type DialogueLine = {
  /** Who's talking / what the sign says / what the plaque reads. */
  speaker: string;
  /** Body text shown in the dialogue frame. Kept single-line for now; the
      real content view (1.4) will render paginated post bodies here. */
  text: string;
};

export type EntityHandler = (entity: EntityAnchor) => DialogueLine;

/** Registry keyed by id (specific-entity behaviours) and by type (fallback
    per-type behaviours). Modules mutate these at import time via
    `registerHandler` / `registerTypeHandler`. */
const byId = new Map<string, EntityHandler>();
const byType = new Map<EntityType, EntityHandler>();

export function registerHandler(id: string, handler: EntityHandler): void {
  byId.set(id, handler);
}

export function registerTypeHandler(type: EntityType, handler: EntityHandler): void {
  byType.set(type, handler);
}

/** Look up the best handler for an entity. Specific ids beat type fallbacks;
    if nothing matches, returns a generic placeholder so the dialogue frame
    never renders an empty box. */
export function resolveDialogue(entity: EntityAnchor): DialogueLine {
  const specific = byId.get(entity.id);
  if (specific) return specific(entity);
  const typed = byType.get(entity.type);
  if (typed) return typed(entity);
  return {
    speaker: "…",
    text: "There's nothing much to see here.",
  };
}

/** Test / hot-reload seam — clears the registry so tests can start from a
    known state. Not exported from `index.ts`; only for internal use. */
export function _resetHandlersForTests(): void {
  byId.clear();
  byType.clear();
}

// ── Async content resolution (Phase 1.4a) ─────────────────────────────────
// Entities that surface real posts skip the sync registry and go through
// this path, which calls INT-01 (`services/content.ts`) with the current
// per-entity cursor. Entities that stay world-line (train station, and
// signs whose content is world-lore not user-posts) keep their sync
// registrations — those beat this async path in `resolveInteraction`.

export type PostContent = {
  kind: "posts";
  posts: readonly AmblePost[];
  nextCursor: string | null;
};

export type LineContent = {
  kind: "line";
  line: DialogueLine;
};

export type EmptyContent = {
  kind: "empty";
  fallback: DialogueLine;
};

export type InteractionResult = PostContent | LineContent | EmptyContent;

const EMPTY_FALLBACKS: Record<EntityType, DialogueLine> = {
  npc: { speaker: "…", text: "They give a small wave and keep to themselves today." },
  sign: { speaker: "Sign", text: "The board is empty — nothing new posted yet." },
  building: { speaker: "You look inside", text: "It's quiet today. Nobody's around." },
  object: { speaker: "You look closer", text: "Nothing much to see right now." },
};

/**
 * Resolve what the dialogue frame should show for an entity, given the
 * current cursor state. Precedence:
 *   1. Sync id-specific handler (e.g. NAV-02 train station) → line
 *   2. INT-01 fetch → posts / empty
 *   3. Sync type handler as a final safety net → line
 */
export async function resolveInteraction(
  entity: EntityAnchor,
  cursor: string | null,
): Promise<InteractionResult> {
  const specific = byId.get(entity.id);
  if (specific) {
    return { kind: "line", line: specific(entity) };
  }
  try {
    const response = await fetchEntityContent(entity.id, cursor);
    if (response.empty || response.posts.length === 0) {
      return { kind: "empty", fallback: EMPTY_FALLBACKS[entity.type] };
    }
    return { kind: "posts", posts: response.posts, nextCursor: response.next_cursor };
  } catch {
    const typed = byType.get(entity.type);
    if (typed) return { kind: "line", line: typed(entity) };
    return { kind: "empty", fallback: EMPTY_FALLBACKS[entity.type] };
  }
}

// ── Default per-type handlers (Phase 1.3 stubs) ───────────────────────────
// These return static placeholder lines. Phase 1.4 will replace the body
// with real content from INT-01 (existing content logic).
registerTypeHandler("npc", (entity) => ({
  speaker: entity.id,
  text: "…they look up, then keep walking.",
}));

registerTypeHandler("sign", () => ({
  speaker: "Sign",
  text: "The paint has faded. You can't quite make out what it used to say.",
}));

registerTypeHandler("building", (entity) => ({
  speaker: entity.id,
  text: "The door is locked. Try again later.",
}));

registerTypeHandler("object", () => ({
  speaker: "You look closer",
  text: "Just an old bench. Someone's carved their initials into it.",
}));

// ── Specific-entity handlers ──────────────────────────────────────────────
// NAV-02: the train station is a landmark that must respond with a clear,
// in-character "coming soon" line — never appear broken.
registerHandler("train-station", () => ({
  speaker: "Station Attendant",
  text: "Line's not running yet — check back once we've laid track to the next town.",
}));
