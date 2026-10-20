import { renderHook, act } from "@testing-library/react";
import {
  useAllTopics,
  useBubbleAnimation,
  useCarouselAutoRotate,
  useFocusTimer,
  useViewportDimensions,
} from "@/app/bubbles/useAnimation";
import type { Bubble, BubbleSettings } from "@/app/bubbles/types";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1, text: "Post", username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...overrides,
});
const makeBubble = (overrides: Partial<Bubble> = {}): Bubble => ({
  label: "Music", color: "#e67e22", isFeed: false, x: 100, y: 100, vx: 1, vy: -2, size: 50,
  ...overrides,
});
const VIEW = { w: 800, h: 600 };

describe("useViewportDimensions", () => {
  const original = { w: window.innerWidth, h: window.innerHeight };
  const setWindow = (w: number, h: number) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: w });
    Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: h });
  };
  afterEach(() => setWindow(original.w, original.h));

  it("reports the window size and follows resizes until unmounted", () => {
    setWindow(1234, 567);
    const { result, unmount } = renderHook(() => useViewportDimensions());
    expect(result.current).toEqual({ w: 1234, h: 567 });

    act(() => { setWindow(640, 480); window.dispatchEvent(new Event("resize")); });
    expect(result.current).toEqual({ w: 640, h: 480 });

    unmount();
    act(() => { setWindow(320, 240); window.dispatchEvent(new Event("resize")); });
    expect(result.current).toEqual({ w: 640, h: 480 });
  });
});

describe("useAllTopics", () => {
  const none: BubbleSettings = { custom_topics: [], hidden_topics: [] };
  const labels = (settings: BubbleSettings) =>
    renderHook(() => useAllTopics(VIEW, settings)).result.current.map((b) => b.label);

  it("builds 2 feed bubbles followed by the 18 general topics", () => {
    const bubbles = renderHook(() => useAllTopics(VIEW, none)).result.current;
    expect(bubbles).toHaveLength(20);
    expect(bubbles.filter((b) => b.isFeed).map((b) => b.label)).toEqual(["Algo", "Following"]);
    expect(bubbles.filter((b) => b.isFeed).every((b) => b.size === 90)).toBe(true);
  });

  it.each([
    ["exact case", ["Music"]],
    ["different case", ["mUSIC"]],
  ])("hides a general topic listed in hidden_topics (%s)", (_name, hidden_topics) => {
    const result = labels({ custom_topics: [], hidden_topics });
    expect(result).toHaveLength(19);
    expect(result).not.toContain("Music");
  });

  it("never hides feed topics", () => {
    expect(labels({ custom_topics: [], hidden_topics: ["Algo", "Following"] })).toEqual(
      expect.arrayContaining(["Algo", "Following"]),
    );
  });

  it("appends custom topics (skipping hidden ones) and cycles the 7-colour palette", () => {
    const custom_topics = ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"];
    const all = renderHook(() => useAllTopics(VIEW, { custom_topics, hidden_topics: [] })).result.current;
    const customs = all.slice(20);
    expect(customs.map((b) => b.label)).toEqual(custom_topics);
    expect(customs.every((b) => !b.isFeed)).toBe(true);
    expect(new Set(customs.slice(0, 7).map((b) => b.color)).size).toBe(7);
    expect(customs[7].color).toBe(customs[0].color);

    expect(labels({ custom_topics: ["Knitting", "Chess"], hidden_topics: ["knitting"] }).slice(20)).toEqual(["Chess"]);
  });

  it.each([
    ["desktop", { w: 1280, h: 720 }],
    ["phone", { w: 390, h: 844 }],
  ])("places every bubble fully inside a %s viewport at a gentle speed, deterministically", (_name, view) => {
    const first = renderHook(() => useAllTopics(view, none)).result.current;
    const second = renderHook(() => useAllTopics(view, none)).result.current;
    expect(second).toEqual(first);
    for (const b of first) {
      expect(b.x).toBeGreaterThanOrEqual(b.size);
      expect(b.x).toBeLessThanOrEqual(view.w - b.size);
      expect(b.y).toBeGreaterThanOrEqual(b.size);
      expect(b.y).toBeLessThanOrEqual(view.h - b.size);
      expect(b.size).toBeGreaterThanOrEqual(70);
      expect(b.size).toBeLessThanOrEqual(90);
      const speed = Math.hypot(b.vx, b.vy);
      expect(speed).toBeGreaterThanOrEqual(0.15 - 1e-9);
      expect(speed).toBeLessThanOrEqual(0.4 + 1e-9);
    }
  });
});

describe("useBubbleAnimation", () => {
  let frames: FrameRequestCallback[] = [];
  const originalRAF = global.requestAnimationFrame;
  const originalCAF = global.cancelAnimationFrame;
  const cancelSpy = jest.fn();
  const runFrame = () => act(() => { frames.shift()?.(0); });

  beforeEach(() => {
    frames = [];
    cancelSpy.mockClear();
    global.requestAnimationFrame = (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; };
    global.cancelAnimationFrame = cancelSpy;
  });
  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
  });

  it.each([
    ["overview speed", false, 100.4, 99.2, 100.08, 100.06],
    ["slowed to a crawl while zoomed", true, 100.05, 99.9, 100.01, 100.0075],
  ])("advances bubbles and the profile bubble one step per frame — %s", (_name, isZoomed, x, y, px, py) => {
    const initialBubbles = [makeBubble()];
    const { result } = renderHook(() => useBubbleAnimation({ dimensions: VIEW, initialBubbles, isZoomed }));
    expect(result.current.bubbles[0]).toMatchObject({ x: 100, y: 100 });
    expect(result.current.profileBubble).toEqual({ x: 100, y: 100, vx: 0.2, vy: 0.15 });

    runFrame();
    expect(result.current.bubbles[0].x).toBeCloseTo(x);
    expect(result.current.bubbles[0].y).toBeCloseTo(y);
    expect(result.current.profileBubble.x).toBeCloseTo(px);
    expect(result.current.profileBubble.y).toBeCloseTo(py);

    runFrame();
    expect(result.current.bubbles[0].x).toBeCloseTo(100 + (x - 100) * 2);
  });

  it.each([
    ["left wall", { x: 30, vx: -20 }, { x: 25, vx: 20 }],
    ["right wall", { x: 770, vx: 20 }, { x: 775, vx: -20 }],
    ["top wall", { y: 30, vy: -20 }, { y: 25, vy: 20 }],
    ["bottom wall", { y: 570, vy: 20 }, { y: 575, vy: -20 }],
  ])("bounces off the %s, staying fully in view", (_name, start, expected) => {
    const initialBubbles = [makeBubble({ vx: 0, vy: 0, ...start })];
    const { result } = renderHook(() => useBubbleAnimation({ dimensions: VIEW, initialBubbles, isZoomed: false }));
    runFrame();
    expect(result.current.bubbles[0]).toMatchObject(expected);
  });

  it("resets positions when the source list changes and cancels its frame on unmount", () => {
    const first = [makeBubble()];
    const second = [makeBubble({ label: "Art", x: 300, y: 300 }), makeBubble({ label: "Film" })];
    const { result, rerender, unmount } = renderHook(
      ({ initialBubbles }) => useBubbleAnimation({ dimensions: VIEW, initialBubbles, isZoomed: false }),
      { initialProps: { initialBubbles: first } },
    );
    runFrame();
    rerender({ initialBubbles: second });
    expect(result.current.bubbles.map((b) => b.label)).toEqual(["Art", "Film"]);
    expect(result.current.bubbles[0]).toMatchObject({ x: 300, y: 300 });

    cancelSpy.mockClear();
    unmount();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });
});

describe("timer-driven hooks", () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it("useCarouselAutoRotate advances only multi-image posts every 3s and wraps", () => {
    const posts = [
      makePost({ id: 1, image_urls: ["a", "b", "c"] }),
      makePost({ id: 2, image_urls: ["only"] }),
      makePost({ id: 3 }),
      makePost({ id: 4, image_urls: ["a", "b"] }),
    ];
    const { result, unmount } = renderHook(() => useCarouselAutoRotate(posts));
    expect(result.current.carouselIndex).toEqual({});

    act(() => { jest.advanceTimersByTime(2999); });
    expect(result.current.carouselIndex).toEqual({});
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current.carouselIndex).toEqual({ 1: 1, 4: 1 });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.carouselIndex).toEqual({ 1: 2, 4: 0 });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.carouselIndex).toEqual({ 1: 0, 4: 1 });

    act(() => { result.current.setCarouselIndex({ 1: 2 }); });
    expect(result.current.carouselIndex).toEqual({ 1: 2 });

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("useFocusTimer counts seconds only while active and can be reset", () => {
    const { result, rerender, unmount } = renderHook(({ active }) => useFocusTimer(active), {
      initialProps: { active: false },
    });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.focusTimer).toBe(0);

    rerender({ active: true });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.focusTimer).toBe(3);

    rerender({ active: false });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.focusTimer).toBe(3);

    act(() => { result.current.setFocusTimer(0); });
    expect(result.current.focusTimer).toBe(0);

    rerender({ active: true });
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.focusTimer).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
