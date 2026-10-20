"use client";
import { useEffect, useMemo, useState } from "react";
import type { Post } from "@/types/post";
import type { Bubble, BubbleSettings, ProfileBubbleState, TopicDef, ViewportSize } from "./types";
import { seededRandom } from "./orbit";
import {
  BUBBLE_SEED,
  CAROUSEL_ROTATE_MS,
  CUSTOM_TOPIC_COLORS,
  FEED_TOPICS,
  GENERAL_TOPICS,
  PROFILE_BUBBLE_SIZE,
} from "./constants";

const FEED_BUBBLE_SIZE = 90;
const TOPIC_BUBBLE_MIN_SIZE = 70;
const TOPIC_BUBBLE_SIZE_VARIATION = 20;
const BUBBLE_MIN_SPEED = 0.15;
const BUBBLE_MAX_SPEED = 0.40;
const ZOOMED_ANIMATION_MULT = 0.05;
const NORMAL_ANIMATION_MULT = 0.4;
const FOCUS_TIMER_TICK_MS = 1000;

/** Hook for the resize listener. Kept separate so consumers that only need
    dimensions don't have to pull in the whole animation hook. */
export function useViewportDimensions(): ViewportSize {
  const [dimensions, setDimensions] = useState<ViewportSize>({ w: 800, h: 600 });
  useEffect(() => {
    setDimensions({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return dimensions;
}

/** Build the initial set of overview bubbles for the given viewport + user
    settings. Deterministic in seed so repeated renders on the same viewport
    produce the same starting positions. */
export function useAllTopics(dimensions: ViewportSize, settings: BubbleSettings): Bubble[] {
  return useMemo(() => {
    const rand = seededRandom(BUBBLE_SEED);
    const hiddenSet = new Set(settings.hidden_topics.map((t) => t.toLowerCase()));

    const customTopics: TopicDef[] = settings.custom_topics
      .filter((t) => !hiddenSet.has(t.toLowerCase()))
      .map((t, i) => ({ label: t, color: CUSTOM_TOPIC_COLORS[i % CUSTOM_TOPIC_COLORS.length] }));

    const combined: TopicDef[] = [
      ...FEED_TOPICS.map((t) => ({ ...t, isFeed: true })),
      ...GENERAL_TOPICS
        .filter((t) => !hiddenSet.has(t.label.toLowerCase()))
        .map((t) => ({ ...t, isFeed: false })),
      ...customTopics,
    ];

    return combined.map((topic): Bubble => {
      const size = topic.isFeed
        ? FEED_BUBBLE_SIZE
        : TOPIC_BUBBLE_MIN_SIZE + rand() * TOPIC_BUBBLE_SIZE_VARIATION;
      const padding = size;
      const angle = rand() * Math.PI * 2;
      const speed = BUBBLE_MIN_SPEED + rand() * (BUBBLE_MAX_SPEED - BUBBLE_MIN_SPEED);
      return {
        ...topic,
        isFeed: !!topic.isFeed,
        x: padding + rand() * (dimensions.w - padding * 2),
        y: padding + rand() * (dimensions.h - padding * 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
      };
    });
  }, [dimensions.w, dimensions.h, settings.custom_topics, settings.hidden_topics]);
}

type UseBubbleAnimationOptions = {
  dimensions: ViewportSize;
  initialBubbles: Bubble[];
  isZoomed: boolean;
};

/**
 * Run the rAF-driven drift animation for overview bubbles + the user's
 * profile avatar bubble. Slows to a crawl when the user has drilled into
 * a topic so the constellation doesn't distract.
 */
export function useBubbleAnimation({
  dimensions, initialBubbles, isZoomed,
}: UseBubbleAnimationOptions) {
  const [bubbles, setBubbles] = useState<Bubble[]>(initialBubbles);
  const [profileBubble, setProfileBubble] = useState<ProfileBubbleState>({
    x: 100, y: 100, vx: 0.2, vy: 0.15,
  });

  // Reset overview bubble positions whenever the source list changes.
  useEffect(() => { setBubbles(initialBubbles); }, [initialBubbles]);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      const speedMult = isZoomed ? ZOOMED_ANIMATION_MULT : NORMAL_ANIMATION_MULT;
      setBubbles((prev) => prev.map((b) => step(b, b.size, dimensions, speedMult)));
      setProfileBubble((pb) => step(pb, PROFILE_BUBBLE_SIZE, dimensions, speedMult));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [dimensions, isZoomed]);

  return { bubbles, profileBubble };
}

/** Rotate the visible image in every multi-image post carousel on a fixed
    interval. Keyed by post id so each carousel advances independently. */
export function useCarouselAutoRotate(posts: Post[]) {
  const [carouselIndex, setCarouselIndex] = useState<Record<number, number>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = { ...prev };
        posts.forEach((p) => {
          if (p.image_urls && p.image_urls.length > 1) {
            next[p.id] = ((next[p.id] || 0) + 1) % p.image_urls.length;
          }
        });
        return next;
      });
    }, CAROUSEL_ROTATE_MS);
    return () => clearInterval(interval);
  }, [posts]);
  return { carouselIndex, setCarouselIndex };
}

/** Focus timer counting up whenever `active` is true. Reset by re-passing
    `false` for one tick from the parent (or by unmount). */
export function useFocusTimer(active: boolean) {
  const [focusTimer, setFocusTimer] = useState(0);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setFocusTimer((t) => t + 1), FOCUS_TIMER_TICK_MS);
    return () => clearInterval(interval);
  }, [active]);
  return { focusTimer, setFocusTimer };
}

// ── Shared physics step ──────────────────────────────────────────────────────

type Drifter = { x: number; y: number; vx: number; vy: number };

/** One-step Euler integration with wall bounce. `size` is used to keep the
    bubble fully inside the viewport (offset by `size/2` from the edges). */
function step<T extends Drifter>(drift: T, size: number, view: ViewportSize, speedMult: number): T {
  let nx = drift.x + drift.vx * speedMult;
  let ny = drift.y + drift.vy * speedMult;
  let nvx = drift.vx;
  let nvy = drift.vy;
  const half = size / 2;
  if (nx < half || nx > view.w - half) nvx = -nvx;
  if (ny < half || ny > view.h - half) nvy = -nvy;
  nx = Math.max(half, Math.min(view.w - half, nx));
  ny = Math.max(half, Math.min(view.h - half, ny));
  return { ...drift, x: nx, y: ny, vx: nvx, vy: nvy };
}
