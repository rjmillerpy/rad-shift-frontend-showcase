import {
  dashStepPixels,
  initialDashState,
  isDashActive,
  stepPixels,
  tryStartDash,
} from "@/app/amble/systems/movement";
import {
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_MULTIPLIER,
} from "@/app/amble/data/constants";

describe("initialDashState", () => {
  it("starts with no active dash and no cooldown pending", () => {
    const state = initialDashState();
    expect(state.activeUntilMs).toBe(0);
    expect(state.cooldownUntilMs).toBe(0);
    expect(isDashActive(state, 0)).toBe(false);
  });
});

describe("tryStartDash", () => {
  it("is a no-op when no direction is pressed", () => {
    const state = initialDashState();
    const result = tryStartDash(state, 1000, false);
    expect(result).toBe(state); // reference-equal — no allocation
  });

  it("activates when direction is pressed and nothing gating", () => {
    const nowMs = 1000;
    const result = tryStartDash(initialDashState(), nowMs, true);
    expect(result.activeUntilMs).toBe(nowMs + DASH_DURATION_MS);
    expect(result.cooldownUntilMs).toBe(nowMs + DASH_DURATION_MS + DASH_COOLDOWN_MS);
  });

  it("is a no-op while a dash is already active", () => {
    const started = tryStartDash(initialDashState(), 1000, true);
    // Halfway through the burst.
    const midDashMs = 1000 + Math.floor(DASH_DURATION_MS / 2);
    const result = tryStartDash(started, midDashMs, true);
    expect(result).toBe(started);
  });

  it("is a no-op during cooldown after the burst ends", () => {
    const started = tryStartDash(initialDashState(), 1000, true);
    // Right after the burst ends, still inside the cooldown window.
    const inCooldownMs = 1000 + DASH_DURATION_MS + 10;
    expect(isDashActive(started, inCooldownMs)).toBe(false);
    const result = tryStartDash(started, inCooldownMs, true);
    expect(result).toBe(started);
  });

  it("re-activates once cooldown has fully elapsed", () => {
    const first = tryStartDash(initialDashState(), 1000, true);
    const afterCooldownMs = 1000 + DASH_DURATION_MS + DASH_COOLDOWN_MS + 1;
    const second = tryStartDash(first, afterCooldownMs, true);
    expect(second).not.toBe(first);
    expect(second.activeUntilMs).toBe(afterCooldownMs + DASH_DURATION_MS);
  });
});

describe("isDashActive", () => {
  it("is true only during the burst window", () => {
    const started = tryStartDash(initialDashState(), 1000, true);
    expect(isDashActive(started, 1000)).toBe(true);
    expect(isDashActive(started, 1000 + DASH_DURATION_MS - 1)).toBe(true);
    expect(isDashActive(started, 1000 + DASH_DURATION_MS)).toBe(false);
    expect(isDashActive(started, 1000 + DASH_DURATION_MS + 10)).toBe(false);
  });
});

describe("dashStepPixels", () => {
  it("returns DASH_MULTIPLIER × the normal step for the same delta", () => {
    const delta = 16;
    expect(dashStepPixels(delta)).toBe(stepPixels(delta) * DASH_MULTIPLIER);
  });
});
