/**
 * Pure canvas-2D composition for the bilateral placeholder avatar.
 *
 * Each half is a stack of colored rectangles drawn in this z-order:
 *   1. skin body (head + torso + legs)
 *   2. clothing (torso + legs)
 *   3. hair (crown + optional trailing shape from HAIR_SHAPES)
 *
 * The two halves are drawn side-by-side; the vertical mirror line falls on
 * `canvas.width / 2`. Real pixel art (per the sprite manifest) will swap in
 * later — the callsite doesn't need to change because it will keep drawing
 * layered shapes at the same anchor points.
 *
 * Kept framework-free so it's testable without a browser (jest-canvas-mock
 * provides the CanvasRenderingContext2D surface). Rule 7.
 */
import type { AvatarHalf } from "../data/schema";
import {
  CLOTHING_COLORS,
  HAIRSTYLE_COLORS,
  SKIN_TONE_COLORS,
  type HairstyleId,
} from "./constants";

export type Side = "left" | "right";

// Relative anchor points (fractions of the half-canvas rect). Kept as a
// single table so the whole avatar can be re-tuned in one place (rule 16).
const ANCHORS = {
  head:   { x: 0.20, y: 0.10, w: 0.60, h: 0.28 },
  torso:  { x: 0.16, y: 0.38, w: 0.68, h: 0.30 },
  legs:   { x: 0.24, y: 0.68, w: 0.52, h: 0.28 },
  crown:  { x: 0.16, y: 0.06, w: 0.68, h: 0.14 },
} as const;

// Gender-driven silhouette tweaks. Kept small — the point is that boy and
// girl produce visually different halves without needing separate assets.
const GENDER_TORSO_INSET_PX = {
  boy: 0,
  girl: 4,
} as const;

// Hair silhouette variations — each hairstyle draws a slightly different
// shape past the crown so the placeholder tells you what you picked.
const HAIR_SHAPES: Record<HairstyleId, "flat" | "long" | "puff" | "buzz" | "tail"> = {
  short: "flat",
  long: "long",
  curly: "puff",
  buzz: "buzz",
  ponytail: "tail",
};

// ── Public API ─────────────────────────────────────────────────────────────

/** Clear + render both halves onto the target canvas. */
export function composeAvatarToCanvas(
  canvas: HTMLCanvasElement,
  avatar: { left: AvatarHalf; right: AvatarHalf },
): void {
  const ctx = canvas.getContext("2d");
  if (ctx === null) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHalf(ctx, avatar.left, "left", canvas.width, canvas.height);
  drawHalf(ctx, avatar.right, "right", canvas.width, canvas.height);
  drawMirrorLine(ctx, canvas.width, canvas.height);
}

// ── Private helpers ────────────────────────────────────────────────────────

function drawHalf(
  ctx: CanvasRenderingContext2D,
  half: AvatarHalf,
  side: Side,
  totalWidth: number,
  totalHeight: number,
): void {
  const halfWidth = totalWidth / 2;
  const originX = side === "left" ? 0 : halfWidth;
  drawSkin(ctx, half, originX, halfWidth, totalHeight);
  drawClothing(ctx, half, originX, halfWidth, totalHeight);
  drawHair(ctx, half, originX, halfWidth, totalHeight);
}

function drawSkin(
  ctx: CanvasRenderingContext2D,
  half: AvatarHalf,
  originX: number,
  halfWidth: number,
  totalHeight: number,
): void {
  ctx.fillStyle = SKIN_TONE_COLORS[half.skin_tone as keyof typeof SKIN_TONE_COLORS];
  fillAnchor(ctx, ANCHORS.head, originX, halfWidth, totalHeight);
  fillAnchor(ctx, ANCHORS.torso, originX, halfWidth, totalHeight);
  fillAnchor(ctx, ANCHORS.legs, originX, halfWidth, totalHeight);
}

function drawClothing(
  ctx: CanvasRenderingContext2D,
  half: AvatarHalf,
  originX: number,
  halfWidth: number,
  totalHeight: number,
): void {
  ctx.fillStyle = CLOTHING_COLORS[half.clothing as keyof typeof CLOTHING_COLORS];
  const inset = GENDER_TORSO_INSET_PX[half.gender];
  const torso = { ...ANCHORS.torso };
  fillAnchor(ctx, torso, originX + inset, halfWidth - inset * 2, totalHeight);
  fillAnchor(ctx, ANCHORS.legs, originX, halfWidth, totalHeight);
}

function drawHair(
  ctx: CanvasRenderingContext2D,
  half: AvatarHalf,
  originX: number,
  halfWidth: number,
  totalHeight: number,
): void {
  ctx.fillStyle = HAIRSTYLE_COLORS[half.hairstyle as keyof typeof HAIRSTYLE_COLORS];
  fillAnchor(ctx, ANCHORS.crown, originX, halfWidth, totalHeight);
  const shape = HAIR_SHAPES[half.hairstyle as HairstyleId] ?? "flat";
  if (shape === "long") {
    ctx.fillRect(originX + halfWidth * 0.20, totalHeight * 0.14, halfWidth * 0.60, totalHeight * 0.30);
  } else if (shape === "puff") {
    ctx.fillRect(originX + halfWidth * 0.10, totalHeight * 0.04, halfWidth * 0.80, totalHeight * 0.10);
  } else if (shape === "tail") {
    ctx.fillRect(originX + halfWidth * 0.70, totalHeight * 0.12, halfWidth * 0.14, totalHeight * 0.24);
  }
  // "buzz" and "flat" render just the crown block — no additional shape.
}

function drawMirrorLine(
  ctx: CanvasRenderingContext2D,
  totalWidth: number,
  totalHeight: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(totalWidth / 2, 0);
  ctx.lineTo(totalWidth / 2, totalHeight);
  ctx.stroke();
  ctx.restore();
}

type Anchor = { x: number; y: number; w: number; h: number };

function fillAnchor(
  ctx: CanvasRenderingContext2D,
  anchor: Anchor,
  originX: number,
  halfWidth: number,
  totalHeight: number,
): void {
  ctx.fillRect(
    originX + anchor.x * halfWidth,
    anchor.y * totalHeight,
    anchor.w * halfWidth,
    anchor.h * totalHeight,
  );
}
