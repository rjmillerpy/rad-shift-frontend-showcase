/**
 * Pure movement logic. Deliberately framework-free (no Phaser types) so it's
 * unit-testable without a canvas (rules 7, 54). The Phaser scene calls into
 * these functions once per frame with the current key state and the elapsed
 * delta.
 */
import {
  AVATAR_SPEED_PX_PER_S,
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_MULTIPLIER,
  MS_PER_SECOND,
} from "../data/constants";

export type Direction = {
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
};

export type KeysDown = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type Position = {
  x: number;
  y: number;
};

/** Resolve the direction implied by the current key state. Opposing keys
    cancel (left+right → 0). Diagonals are un-normalized on purpose — a real
    normalization pass belongs in Phase 1.2 alongside collision. */
export function directionFromKeys(keys: KeysDown): Direction {
  const dx: -1 | 0 | 1 = keys.right && !keys.left ? 1 : keys.left && !keys.right ? -1 : 0;
  const dy: -1 | 0 | 1 = keys.down && !keys.up ? 1 : keys.up && !keys.down ? -1 : 0;
  return { dx, dy };
}

/** Pixel step for a given frame delta at the tuned avatar speed. */
export function stepPixels(deltaMs: number): number {
  return (AVATAR_SPEED_PX_PER_S * deltaMs) / MS_PER_SECOND;
}

/** Returns a NEW position — never mutates (rule 12). */
export function move(position: Position, direction: Direction, step: number): Position {
  return {
    x: position.x + direction.dx * step,
    y: position.y + direction.dy * step,
  };
}

// ── Dash (Phase 1.3b) ───────────────────────────────────────────────────────
// Pure state — the scene owns the current DashState and calls these
// helpers in `update()`. Keeping the state functional means the tests can
// exercise every transition without touching Phaser.

export type DashState = {
  /** Wall-clock timestamp (from Phaser's `time` arg) after which the
      current dash burst has ended. `0` means "not dashing right now". */
  activeUntilMs: number;
  /** Wall-clock timestamp at which the next dash is allowed. `0` means
      "no cooldown pending". */
  cooldownUntilMs: number;
};

export function initialDashState(): DashState {
  return { activeUntilMs: 0, cooldownUntilMs: 0 };
}

/** Attempt to start a fresh dash. Returns the same state (no-op) when the
    request can't be honoured — no direction pressed, dash currently
    active, or cooldown still pending. Returns a new state when the dash
    starts, scheduling both the burst end and the cooldown end. */
export function tryStartDash(
  state: DashState,
  nowMs: number,
  hasDirection: boolean,
): DashState {
  if (!hasDirection) return state;
  if (nowMs < state.activeUntilMs) return state;
  if (nowMs < state.cooldownUntilMs) return state;
  const activeUntilMs = nowMs + DASH_DURATION_MS;
  return {
    activeUntilMs,
    cooldownUntilMs: activeUntilMs + DASH_COOLDOWN_MS,
  };
}

export function isDashActive(state: DashState, nowMs: number): boolean {
  return nowMs < state.activeUntilMs;
}

/** Pixel step for a dash frame. Same delta-scaling as `stepPixels` so the
    dash burst covers a consistent distance regardless of frame rate. */
export function dashStepPixels(deltaMs: number): number {
  return stepPixels(deltaMs) * DASH_MULTIPLIER;
}

/**
 * Move with axis-independent collision "sliding". If the horizontal step
 * would overlap a blocker, x stays put but y still advances. This is the
 * classic tile-based movement feel — walking into a wall doesn't stop the
 * avatar entirely, they slide along it.
 *
 * `isBlocked` is a predicate over destination centre points so tests can
 * inject any world model.
 */
export function moveWithCollision(
  position: Position,
  direction: Direction,
  step: number,
  isBlocked: (x: number, y: number) => boolean,
): Position {
  const candidateX = position.x + direction.dx * step;
  const candidateY = position.y + direction.dy * step;
  const nextX = isBlocked(candidateX, position.y) ? position.x : candidateX;
  const nextY = isBlocked(nextX, candidateY) ? position.y : candidateY;
  return { x: nextX, y: nextY };
}
