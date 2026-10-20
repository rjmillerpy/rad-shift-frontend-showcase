import type { Post } from "@/types/post";
import { MICRO_KEYWORDS } from "./constants";

// ── Deterministic RNG ────────────────────────────────────────────────────────

/** Park-Miller linear congruential generator. Same seed → same sequence.
    Used so bubble layout is stable across renders on the same viewport. */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── Orbit layout ─────────────────────────────────────────────────────────────

const ORBIT_RELAX_ITERATIONS = 30;
const OVERLAP_CLEAR_PAD_PX = 14;
const ORBIT_PULL_STRENGTH = 0.03;
const TOP_PADDING_PX = 50; // leave room for the context bar
const EDGE_PADDING_PX = 4;

/**
 * Arrange `count` bubbles in a rough orbit at `orbitRadius` around (cx, cy),
 * with per-index radius variation for a natural constellation look. Then run
 * a small force-directed relaxation to prevent overlaps, and finally clamp
 * every position inside the viewport.
 *
 * The relaxation is O(iterations * count²). For the ~24-item orbit cap in this
 * page that's <20k operations per placement — cheap.
 */
export function arrangeOrbitBubbles(
  cx: number,
  cy: number,
  count: number,
  orbitRadius: number,
  sizes: number[],
  viewW: number = 1200,
  viewH: number = 800,
): { x: number; y: number }[] {
  // Per-bubble orbit radius (0.6x to 1.4x of base), deterministic from index.
  const radii: number[] = [];
  for (let i = 0; i < count; i++) {
    const variation = 0.6 + ((i * 7 + 3) % 11) / 11 * 0.8;
    radii.push(orbitRadius * variation);
  }

  // Even angular spread, first slot at top (−π/2).
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions.push({
      x: cx + Math.cos(angle) * radii[i],
      y: cy + Math.sin(angle) * radii[i],
    });
  }

  // Force-directed relaxation: repel overlapping neighbours + gentle pull
  // toward each bubble's target orbit distance.
  for (let iter = 0; iter < ORBIT_RELAX_ITERATIONS; iter++) {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = ((sizes[i] || 100) + (sizes[j] || 100)) / 2 + OVERLAP_CLEAR_PAD_PX;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = (dx / dist) * overlap;
          const ny = (dy / dist) * overlap;
          positions[i].x -= nx;
          positions[i].y -= ny;
          positions[j].x += nx;
          positions[j].y += ny;
        }
      }
      const toCenterDx = positions[i].x - cx;
      const toCenterDy = positions[i].y - cy;
      const toCenterDist = Math.sqrt(toCenterDx * toCenterDx + toCenterDy * toCenterDy) || 1;
      positions[i].x += (cx + (toCenterDx / toCenterDist) * radii[i] - positions[i].x) * ORBIT_PULL_STRENGTH;
      positions[i].y += (cy + (toCenterDy / toCenterDist) * radii[i] - positions[i].y) * ORBIT_PULL_STRENGTH;
    }
  }

  // Clamp to viewport bounds so orbit bubbles never sit half off-screen.
  for (let i = 0; i < count; i++) {
    const half = (sizes[i] || 100) / 2 + EDGE_PADDING_PX;
    positions[i].x = Math.max(half, Math.min(viewW - half, positions[i].x));
    positions[i].y = Math.max(TOP_PADDING_PX + half, Math.min(viewH - half, positions[i].y));
  }

  return positions;
}

// ── Category helpers ─────────────────────────────────────────────────────────

const MAX_MAJOR_CATEGORIES = 2;

/** Extract up to `MAX_MAJOR_CATEGORIES` tag strings from a post's metadata.
    Handles both pipe-separated string and array shapes because the backend
    has emitted both formats historically. */
export function extractPostCategories(post: Post): string[] {
  const meta = post.post_metadata;
  if (!meta) return [];
  const tags = meta.tags as unknown;
  const cats: string[] = [];
  if (typeof tags === "string") {
    for (const t of tags.split("|")) {
      if (t.trim()) cats.push(t.trim());
    }
  } else if (Array.isArray(tags)) {
    for (const t of tags) {
      if (typeof t === "string" && t.trim()) cats.push(t.trim());
    }
  }
  return cats.slice(0, MAX_MAJOR_CATEGORIES);
}

/** Return up to `count` micro-category labels for a given topic, deterministically
    shuffled so the same topic always produces the same ordering. */
export function getMicroCategories(topic: string, count: number = 3): string[] {
  const key = topic.toLowerCase();
  const micros = MICRO_KEYWORDS[key];
  if (!micros) return [];
  const shuffled = [...micros].sort((a, b) => {
    const ha = a.charCodeAt(0) + topic.charCodeAt(0);
    const hb = b.charCodeAt(0) + topic.charCodeAt(0);
    return ha - hb;
  });
  return shuffled.slice(0, count);
}
