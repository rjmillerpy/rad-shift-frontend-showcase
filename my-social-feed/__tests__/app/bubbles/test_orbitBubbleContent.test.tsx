import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildBubbleVisual, classifyMedia, getMaxChars } from "@/app/bubbles/orbitBubbleContent";
import type { OrbitItem } from "@/app/bubbles/types";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 5, text: "Short text", username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...overrides,
});

const postItem = (overrides: Partial<Post> = {}): OrbitItem => {
  const post = makePost(overrides);
  return { type: "post", label: post.text, post };
};

const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;
const IMG = "https://cdn.example.com/a.jpg";
const IMG2 = "https://cdn.example.com/b.jpg";
const VIDEO = "https://cdn.example.com/v.mp4";
const AUDIO = "https://cdn.example.com/a.mp3";
const PLACEHOLDER = "https://ui-avatars.com/api/?name=US";
const CENTER = "#123456";

/** Render a visual's content the way OrbitBubble does: as the child of a container. */
const renderContent = (item: OrbitItem, size = 120, carouselIndex: Record<number, number> = {}) => {
  const visual = buildBubbleVisual(item, size, CENTER, carouselIndex);
  return { visual, ...render(<div data-testid="host">{visual.content}</div>) };
};

describe("getMaxChars", () => {
  it.each([
    ["tiny bubble uses the floor", 0, 20],
    ["just below where the floor stops applying", 52, 20],
    ["first size above the floor", 53, 21],
    ["typical bubble", 130, 90],
    ["large bubble", 200, 153],
  ])("%s: size %i -> %i chars", (_name, size, expected) => {
    expect(getMaxChars(size)).toBe(expected);
  });
});

describe("classifyMedia", () => {
  it.each([
    ["video only", { video_url: VIDEO }, "video"],
    ["video wins over image and audio", { video_url: VIDEO, image_url: IMG, audio_url: AUDIO }, "video"],
    ["image only", { image_url: IMG }, "image"],
    ["image wins over audio", { image_url: IMG, audio_url: AUDIO }, "image"],
    ["audio only", { audio_url: AUDIO }, "audio"],
    ["placeholder avatar image counts as text", { image_url: PLACEHOLDER }, "text"],
    ["placeholder avatar image falls through to audio", { image_url: PLACEHOLDER, audio_url: AUDIO }, "audio"],
    ["no media", {}, "text"],
    ["null media fields", { video_url: null, image_url: null, audio_url: null }, "text"],
  ])("%s -> %s", (_name, overrides, expected) => {
    expect(classifyMedia(makePost(overrides))).toBe(expected);
  });
});

describe("buildBubbleVisual — controls and tags", () => {
  it.each([
    ["back", "←"],
    ["balloon", "🎈"],
  ] as const)("%s control shows %s and glows in the centre colour", (type, glyph) => {
    const { visual } = renderContent({ type, label: "x" });
    expect(screen.getByTestId("host")).toHaveTextContent(glyph);
    expect(visual.baseShadow).toContain(CENTER);
    expect(visual.tagColor).toBeUndefined();
  });

  it("paginate control shows the 'Load more' image", () => {
    renderContent({ type: "paginate", label: "More" });
    expect(screen.getByAltText("Load more")).toHaveAttribute("src", "/paginate.png");
  });

  it.each([
    ["subcategory matching a general topic", "subcategory", "technology", "#e74c3c"],
    ["subcategory match is case-insensitive", "subcategory", "GAMING", "#2ecc71"],
    ["unknown subcategory", "subcategory", "rust", "#8e44ad"],
    ["micro matching a general topic", "micro", "Photography", "#636e72"],
    ["unknown micro", "micro", "AI", "#555"],
  ] as const)("%s takes colour %s", (_name, type, tag, color) => {
    const visual = buildBubbleVisual({ type, label: "Label", tag }, 90, CENTER, {});
    expect(visual.tagColor).toBe(color);
    expect(visual.bgColor).toBe(color);
    expect(visual.content).toBe("Label");
  });

  it("draws micro chips smaller and dashed, subcategories solid", () => {
    const micro = buildBubbleVisual({ type: "micro", label: "AI", tag: "AI" }, 75, CENTER, {});
    const sub = buildBubbleVisual({ type: "subcategory", label: "Rust", tag: "rust" }, 90, CENTER, {});
    expect(micro.border).toContain("dashed");
    expect(sub.border).toContain("solid");
    expect(parseInt(micro.fontSize, 10)).toBeLessThan(parseInt(sub.fontSize, 10));
  });
});

describe("buildBubbleVisual — posts", () => {
  it.each([
    ["video", { video_url: VIDEO }, "video-bubble"],
    ["image", { image_url: IMG }, "image-bubble"],
    ["audio", { audio_url: AUDIO }, "audio-bubble"],
  ])("renders a %s post as its media bubble", (_kind, overrides, testId) => {
    renderContent(postItem(overrides));
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    for (const other of ["video-bubble", "image-bubble", "audio-bubble"].filter((t) => t !== testId)) {
      expect(screen.queryByTestId(other)).not.toBeInTheDocument();
    }
  });

  it("renders a text post with its text and the author's avatar", () => {
    const { container } = renderContent(postItem({ profile_picture_url: "/uploads/me.png" }));
    expect(screen.getByText("Short text")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("src", "/uploads/me.png");
    expect(screen.queryByTestId("image-bubble")).not.toBeInTheDocument();
  });

  it.each([
    ["shorter than the limit", 89, false],
    ["exactly at the limit", 90, false],
    ["one over the limit", 91, true],
  ])("text %s (%i chars in a 130px bubble) truncated=%s", (_name, length, truncated) => {
    const text = "x".repeat(length);
    renderContent(postItem({ text }), 130);
    const expected = truncated ? "x".repeat(90) + "…" : text;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    [160, "12px"], [140, "12px"], [139, "11px"], [110, "11px"], [109, "10px"], [80, "10px"],
  ])("text post in a %ipx bubble uses a %s font", (size, fontSize) => {
    expect(buildBubbleVisual(postItem(), size, CENTER, {}).fontSize).toBe(fontSize);
  });

  it("uses the image as a video thumbnail when present, else the video itself", () => {
    const withThumb = renderContent(postItem({ video_url: VIDEO, image_url: IMG }));
    expect(withThumb.container.querySelector("img")).toHaveAttribute("src", proxied(IMG));
    expect(withThumb.container.querySelector("video")).toBeNull();
    withThumb.unmount();

    const noThumb = renderContent(postItem({ video_url: VIDEO }));
    expect(noThumb.container.querySelector("video")).toHaveAttribute("src", VIDEO);
    expect(noThumb.container.querySelector("img")).toBeNull();
  });

  it("hides a broken video thumbnail", () => {
    const { container } = renderContent(postItem({ video_url: VIDEO, image_url: IMG }));
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(img.style.display).toBe("none");
  });

  it("shows a single image with no carousel dots, and falls back to the default avatar on error", () => {
    const { container } = renderContent(postItem({ image_url: IMG }));
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", proxied(IMG));
    expect(screen.queryByTestId("carousel-dots")).not.toBeInTheDocument();
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "https://ui-avatars.com/api/?name=User");
  });

  it.each([
    ["first image by default", {}, IMG],
    ["second image when the carousel has advanced", { 5: 1 }, IMG2],
    ["wraps past the end", { 5: 2 }, IMG],
    ["ignores another post's index", { 6: 1 }, IMG],
  ])("multi-image post shows the %s with one dot per image", (_name, carouselIndex, shown) => {
    const { container } = renderContent(postItem({ image_url: IMG, image_urls: [IMG, IMG2] }), 120, carouselIndex);
    expect(container.querySelector("img")).toHaveAttribute("src", proxied(shown));
    expect(screen.getByTestId("carousel-dots").children).toHaveLength(2);
  });

  it.each([
    ["shows a short caption", 40, true],
    ["drops a caption longer than 40 characters", 41, false],
  ])("audio bubble %s (%i chars)", (_name, length, shown) => {
    const text = "a".repeat(length);
    renderContent(postItem({ audio_url: AUDIO, text }), 200);
    if (shown) expect(screen.getByText(text)).toBeInTheDocument();
    else expect(screen.queryByText(text)).not.toBeInTheDocument();
  });
});
