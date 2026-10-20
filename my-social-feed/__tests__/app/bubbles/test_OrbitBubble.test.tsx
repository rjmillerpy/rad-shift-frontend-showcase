import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OrbitBubble from "@/app/bubbles/OrbitBubble";
import type { OrbitItem } from "@/app/bubbles/types";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 5, text: "Post text", username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...overrides,
});
const postItem = (overrides: Partial<Post> = {}): Extract<OrbitItem, { type: "post" }> => {
  const post = makePost(overrides);
  return { type: "post", label: post.text, post };
};

const VIDEO = "https://cdn.example.com/v.mp4";
const AUDIO = "https://cdn.example.com/a.mp3";
const IMG = "https://cdn.example.com/a.jpg";

type Props = React.ComponentProps<typeof OrbitBubble>;
const setup = (item: OrbitItem, overrides: Partial<Props> = {}) => {
  const handlers = {
    onBack: jest.fn(), onHome: jest.fn(), onPaginate: jest.fn(), onTopicClick: jest.fn(),
    onPostClick: jest.fn(), onContextMenuPost: jest.fn(), onHoverEnter: jest.fn(),
    onHoverMove: jest.fn(), onHoverLeave: jest.fn(),
  };
  render(
    <OrbitBubble
      item={item} position={{ x: 300, y: 200 }} size={100} viewScale={1}
      centerColor="#123456" carouselIndex={{}}
      isVisitedTopic={false} isVisitedPost={false} isDeepRead={false}
      {...handlers} {...overrides}
    />,
  );
  return { handlers, button: screen.getByTitle(item.label) };
};

const expectOnlyCalled = (handlers: Record<string, jest.Mock>, name: string) => {
  for (const [key, fn] of Object.entries(handlers)) {
    expect(fn).toHaveBeenCalledTimes(key === name ? 1 : 0);
  }
};

describe("OrbitBubble — click routing", () => {
  it.each([
    ["back", "Back", "onBack"],
    ["balloon", "🎈", "onHome"],
    ["paginate", "More", "onPaginate"],
  ] as const)("%s bubble calls only %s%s", (type, label, handler) => {
    const { handlers, button } = setup({ type, label });
    fireEvent.click(button);
    expectOnlyCalled(handlers, handler);
  });

  it.each([
    ["subcategory matching a general topic", "subcategory", "Gaming", "gaming", "#2ecc71"],
    ["unknown subcategory", "subcategory", "Rust", "rust", "#8e44ad"],
    ["unknown micro", "micro", "AI", "AI", "#555"],
  ] as const)("%s drills into the topic with its colour", (_name, type, label, tag, color) => {
    const { handlers, button } = setup({ type, label, tag });
    fireEvent.click(button);
    expectOnlyCalled(handlers, "onTopicClick");
    expect(handlers.onTopicClick).toHaveBeenCalledWith(label, color);
  });

  it("post bubble calls onPostClick with the post", () => {
    const item = postItem();
    const { handlers, button } = setup(item);
    fireEvent.click(button);
    expectOnlyCalled(handlers, "onPostClick");
    expect(handlers.onPostClick).toHaveBeenCalledWith(item.post);
  });
});

describe("OrbitBubble — context menu and hover", () => {
  it("right-clicking a post reports the post and cursor, suppressing the browser menu", () => {
    const item = postItem();
    const { handlers, button } = setup(item);
    const notCancelled = fireEvent.contextMenu(button, { clientX: 11, clientY: 22 });
    expect(notCancelled).toBe(false);
    expect(handlers.onContextMenuPost).toHaveBeenCalledWith(item.post, 11, 22);
    expect(handlers.onPostClick).not.toHaveBeenCalled();
  });

  it("right-clicking a control suppresses the browser menu but reports nothing", () => {
    const { handlers, button } = setup({ type: "back", label: "Back" });
    expect(fireEvent.contextMenu(button)).toBe(false);
    expect(handlers.onContextMenuPost).not.toHaveBeenCalled();
    expect(handlers.onBack).not.toHaveBeenCalled();
  });

  it("reports hover enter, move and leave for a post, scaling the bubble while hovered", () => {
    const item = postItem();
    const { handlers, button } = setup(item);
    const wrapper = button.parentElement!;

    fireEvent.mouseEnter(wrapper, { clientX: 10, clientY: 20 });
    expect(handlers.onHoverEnter).toHaveBeenCalledWith(item.post, 10, 20);
    expect(wrapper.style.transform).toBe("scale(1.12)");

    fireEvent.mouseMove(wrapper, { clientX: 30, clientY: 40 });
    expect(handlers.onHoverMove).toHaveBeenCalledWith(30, 40);

    fireEvent.mouseLeave(wrapper);
    expect(handlers.onHoverLeave).toHaveBeenCalledTimes(1);
    expect(wrapper.style.transform).toBe("scale(1)");
  });

  it("hovering a non-post bubble never reports enter/move", () => {
    const { handlers, button } = setup({ type: "micro", label: "AI", tag: "AI" });
    const wrapper = button.parentElement!;
    fireEvent.mouseEnter(wrapper, { clientX: 10, clientY: 20 });
    fireEvent.mouseMove(wrapper, { clientX: 30, clientY: 40 });
    fireEvent.mouseLeave(wrapper);
    expect(handlers.onHoverEnter).not.toHaveBeenCalled();
    expect(handlers.onHoverMove).not.toHaveBeenCalled();
    expect(handlers.onHoverLeave).toHaveBeenCalledTimes(1);
  });
});

describe("OrbitBubble — shape per media type", () => {
  it.each([
    ["video", { video_url: VIDEO }, "tv-antennae", { w: "160px", h: "100px", radius: "12px" }],
    ["audio", { audio_url: AUDIO }, "radio-antenna", { w: "100px", h: "100px", radius: "16px" }],
    ["image", { image_url: IMG }, null, { w: "110px", h: "110px", radius: "4px" }],
    ["text", {}, null, { w: "100px", h: "100px", radius: "50%" }],
  ])("%s post gets the right antenna, size and corner radius", (_kind, media, antennaId, box) => {
    const { button } = setup(postItem(media));
    expect(button.style.width).toBe(box.w);
    expect(button.style.height).toBe(box.h);
    expect(button.style.borderRadius).toBe(box.radius);
    for (const id of ["tv-antennae", "radio-antenna"]) {
      if (id === antennaId) expect(screen.getByTestId(id)).toBeInTheDocument();
      else expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
  });

  it.each([
    ["half scale shrinks the video minimum", 0.5, 40, "80px", "50px"],
    ["a large base size wins over the minimum", 1, 200, "320px", "200px"],
  ])("video bubble: %s", (_name, viewScale, size, w, h) => {
    const { button } = setup(postItem({ video_url: VIDEO }), { viewScale, size });
    expect(button.style.width).toBe(w);
    expect(button.style.height).toBe(h);
  });

  it("centres a plain bubble on its orbit position", () => {
    const { button } = setup({ type: "back", label: "Back" });
    const wrapper = button.parentElement!;
    expect(wrapper.style.left).toBe("250px");
    expect(wrapper.style.top).toBe("150px");
  });

  it("makes room above an audio bubble for its antenna, keeping the body centred", () => {
    const { button } = setup(postItem({ audio_url: AUDIO }));
    const wrapper = button.parentElement!;
    const antennaH = parseFloat(button.style.top);
    expect(antennaH).toBeGreaterThan(0);
    expect(parseFloat(wrapper.style.top)).toBe(150 - antennaH);
    expect(parseFloat(wrapper.style.height)).toBe(100 + antennaH);
  });
});

describe("OrbitBubble — visited and deep-read state", () => {
  it.each([
    ["visited topic chip", { type: "subcategory", label: "Rust", tag: "rust" } as OrbitItem, { isVisitedTopic: true }, true],
    ["visited post", postItem(), { isVisitedPost: true }, true],
    ["unvisited topic chip", { type: "subcategory", label: "Rust", tag: "rust" } as OrbitItem, {}, false],
    ["unvisited post", postItem(), {}, false],
  ])("%s: tick and dimming shown=%s", (_name, item, flags, visited) => {
    const { button } = setup(item, flags);
    if (visited) {
      expect(screen.getByTestId("visited-indicator")).toHaveTextContent("✓");
      expect(button.style.opacity).toBe("0.5");
    } else {
      expect(screen.queryByTestId("visited-indicator")).not.toBeInTheDocument();
      expect(button.style.opacity).toBe("1");
    }
  });

  it("adds an extra glow ring only when the post was deeply read", () => {
    const plain = setup(postItem());
    const plainShadow = plain.button.style.boxShadow;
    const deep = setup(postItem({ id: 6, text: "Deep read post" }), { isDeepRead: true });
    const deepShadow = deep.button.style.boxShadow;
    expect(deepShadow).not.toBe(plainShadow);
    expect(deepShadow.endsWith(plainShadow)).toBe(true);
    expect(deepShadow.length).toBeGreaterThan(plainShadow.length);
  });
});
