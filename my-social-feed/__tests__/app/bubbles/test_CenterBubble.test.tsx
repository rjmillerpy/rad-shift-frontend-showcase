import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CenterBubble from "@/app/bubbles/CenterBubble";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 7, text: "Full post text", username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...overrides,
});

const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;
const IMG = "https://cdn.example.com/a.jpg";
const IMG2 = "https://cdn.example.com/b.jpg";
const IMG3 = "https://cdn.example.com/c.jpg";

type Props = React.ComponentProps<typeof CenterBubble>;
const setup = (overrides: Partial<Props> = {}) => {
  const handlers = { onCarouselChange: jest.fn(), onOpenPost: jest.fn(), onContextMenu: jest.fn() };
  const utils = render(
    <CenterBubble
      selectedPost={null}
      selectedTopic={{ label: "Technology", color: "#e74c3c" }}
      cx={500} cy={400} viewScale={1} centerSize={100}
      centerColor="#e74c3c" centerLabel="Technology"
      carouselIndex={{}}
      {...handlers}
      {...overrides}
    />,
  );
  return { ...utils, ...handlers };
};

describe("CenterBubble — topic centre", () => {
  it("shows the topic label and is not interactive", () => {
    const { onOpenPost, onContextMenu } = setup();
    const bubble = screen.getByTitle("Technology");
    expect(bubble).toHaveTextContent("Technology");
    expect(bubble.style.cursor).toBe("default");

    fireEvent.click(bubble);
    fireEvent.contextMenu(bubble, { clientX: 5, clientY: 6 });
    expect(onOpenPost).not.toHaveBeenCalled();
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  it("renders no antennae or media elements", () => {
    const { container } = setup();
    expect(screen.queryByTestId("center-tv-antennae")).not.toBeInTheDocument();
    expect(screen.queryByTestId("center-radio-antenna")).not.toBeInTheDocument();
    expect(container.querySelector("video, audio, img")).toBeNull();
  });
});

describe("CenterBubble — post centre", () => {
  it("shows the (possibly truncated) label but keeps the full text as the title", () => {
    setup({ selectedPost: makePost(), centerLabel: "Full post…" });
    expect(screen.getByTitle("Full post text")).toHaveTextContent("Full post…");
  });

  it("opens the post from the keyboard, as a labelled button", () => {
    const { onOpenPost } = setup({ selectedPost: makePost(), centerLabel: "Full post text" });
    const bubble = screen.getByRole("button", { name: "Open post" });
    fireEvent.keyDown(bubble, { key: "Enter" });
    expect(onOpenPost).toHaveBeenCalledWith(7);
  });

  it("opens the post on click", () => {
    const { onOpenPost } = setup({ selectedPost: makePost(), centerLabel: "Full post text" });
    fireEvent.click(screen.getByTitle("Full post text"));
    expect(onOpenPost).toHaveBeenCalledTimes(1);
    expect(onOpenPost).toHaveBeenCalledWith(7);
  });

  it("reports a right-click with the post and cursor position, suppressing the browser menu", () => {
    const post = makePost();
    const { onContextMenu } = setup({ selectedPost: post });
    const notCancelled = fireEvent.contextMenu(screen.getByTitle("Full post text"), { clientX: 33, clientY: 44 });
    expect(notCancelled).toBe(false);
    expect(onContextMenu).toHaveBeenCalledWith(post, 33, 44);
  });

  it.each([
    ["text", {}, null, { w: "100px", h: "100px", left: "450px", top: "350px" }],
    ["video", { video_url: "https://cdn.example.com/v.mp4" }, "center-tv-antennae", { w: "280px", h: "180px", left: "360px", top: "310px" }],
    ["audio", { audio_url: "https://cdn.example.com/a.mp3" }, "center-radio-antenna", { w: "100px", h: "100px", left: "450px", top: "350px" }],
    ["image", { image_url: IMG }, null, { w: "180px", h: "180px", left: "410px", top: "310px" }],
  ])("sizes and centres a %s post, with the matching antenna", (_kind, media, antennaId, box) => {
    setup({ selectedPost: makePost(media), centerLabel: "Full post text" });
    const { style } = screen.getByTitle("Full post text");
    expect(style.width).toBe(box.w);
    expect(style.height).toBe(box.h);
    expect(style.left).toBe(box.left);
    expect(style.top).toBe(box.top);
    for (const id of ["center-tv-antennae", "center-radio-antenna"]) {
      if (id === antennaId) expect(screen.getByTestId(id)).toBeInTheDocument();
      else expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
  });

  it("grows a video centre beyond the minimum when the base size is large", () => {
    setup({ selectedPost: makePost({ video_url: "https://cdn.example.com/v.mp4" }), centerSize: 200 });
    const { style } = screen.getByTitle("Full post text");
    expect(style.width).toBe("360px");
    expect(style.height).toBe("240px");
  });

  it("renders a video player with the image as poster, and clicking it doesn't open the post", () => {
    const { container, onOpenPost } = setup({
      selectedPost: makePost({ video_url: "https://cdn.example.com/v.mp4", image_url: IMG }),
    });
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("src", "https://cdn.example.com/v.mp4");
    expect(video).toHaveAttribute("poster", IMG);
    expect(video).toHaveAttribute("controls");
    // video wins over image: no <img> is rendered
    expect(container.querySelector("img")).toBeNull();
    fireEvent.click(video);
    expect(onOpenPost).not.toHaveBeenCalled();
  });

  it("renders an audio player with the label, and clicking it doesn't open the post", () => {
    const { container, onOpenPost } = setup({
      selectedPost: makePost({ audio_url: "https://cdn.example.com/a.mp3" }), centerLabel: "Listen up",
    });
    const audio = container.querySelector("audio")!;
    expect(audio).toHaveAttribute("src", "https://cdn.example.com/a.mp3");
    expect(screen.getByText("Listen up")).toBeInTheDocument();
    fireEvent.click(audio);
    expect(onOpenPost).not.toHaveBeenCalled();
  });
});

describe("CenterBubble — image carousel", () => {
  it("renders a single image through the proxy with a caption and no carousel controls", () => {
    const { container } = setup({ selectedPost: makePost({ image_url: IMG, image_urls: [IMG] }), centerLabel: "Caption" });
    expect(container.querySelector("img")).toHaveAttribute("src", proxied(IMG));
    expect(screen.getByText("Caption")).toBeInTheDocument();
    expect(screen.queryByTestId("center-carousel-prev")).not.toBeInTheDocument();
    expect(screen.queryByTestId("center-carousel-next")).not.toBeInTheDocument();
  });

  it.each([
    ["first image by default", {}, IMG, 2, 1],
    ["second image", { 7: 1 }, IMG2, 0, 2],
    ["last image", { 7: 2 }, IMG3, 1, 0],
    ["index past the end wraps", { 7: 4 }, IMG2, 0, 2],
    ["another post's index is ignored", { 99: 2 }, IMG, 2, 1],
  ])("shows the %s and wraps prev/next", (_name, carouselIndex, shown, prev, next) => {
    const { container, onCarouselChange, onOpenPost } = setup({
      selectedPost: makePost({ image_url: IMG, image_urls: [IMG, IMG2, IMG3] }),
      carouselIndex,
    });
    expect(container.querySelector("img")).toHaveAttribute("src", proxied(shown));

    fireEvent.click(screen.getByTestId("center-carousel-prev"));
    expect(onCarouselChange).toHaveBeenLastCalledWith(7, prev);
    fireEvent.click(screen.getByTestId("center-carousel-next"));
    expect(onCarouselChange).toHaveBeenLastCalledWith(7, next);
    // Carousel buttons must not also open the post.
    expect(onOpenPost).not.toHaveBeenCalled();
  });
});
