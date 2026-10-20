import React from "react";
import { render, screen } from "@testing-library/react";
import PostHoverTooltip from "@/app/bubbles/PostHoverTooltip";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1, text: "Hello\nworld", username: "alice",
  likes: 11, reposts: 22, shares: 33, saves: 44, laughs: 55, unix_timestamp: 1700000000,
  ...overrides,
});

const viewport = { w: 1000, h: 800 };

describe("PostHoverTooltip", () => {
  it("shows the author, full text and engagement counts", () => {
    render(<PostHoverTooltip post={makePost({ quotes_count: 6 })} x={0} y={0} viewport={viewport} />);
    const tip = screen.getByTestId("post-tooltip");
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(tip).toHaveTextContent("Hello world");
    expect(tip).toHaveTextContent("11 likes");
    expect(tip).toHaveTextContent("55 laughs");
    expect(tip).toHaveTextContent("22 reposts");
    expect(tip).toHaveTextContent("33 shares");
    expect(tip).toHaveTextContent("44 saves");
    expect(tip).toHaveTextContent("6 quotes");
  });

  it("shows the post's local date and time", () => {
    render(<PostHoverTooltip post={makePost()} x={0} y={0} viewport={viewport} />);
    expect(screen.getByText(new Date(1700000000 * 1000).toLocaleString())).toBeInTheDocument();
  });

  it("falls back to 0 quotes when the count is missing", () => {
    render(<PostHoverTooltip post={makePost({ quotes_count: undefined })} x={0} y={0} viewport={viewport} />);
    expect(screen.getByTestId("post-tooltip")).toHaveTextContent("0 quotes");
  });

  it.each([
    ["replies shown when positive", { replies_count: 3 }, "3 replies", true],
    ["replies hidden when zero", { replies_count: 0 }, "replies", false],
    ["replies hidden when missing", {}, "replies", false],
    ["slop shown when positive", { slop_count: 2 }, "2 slop", true],
    ["slop hidden when zero", { slop_count: 0 }, "slop", false],
    ["slop hidden when missing", {}, "slop", false],
  ])("%s", (_name, overrides, text, visible) => {
    render(<PostHoverTooltip post={makePost(overrides)} x={0} y={0} viewport={viewport} />);
    const tip = screen.getByTestId("post-tooltip");
    if (visible) expect(tip).toHaveTextContent(text);
    else expect(tip).not.toHaveTextContent(text);
  });

  it.each([
    ["offset from the cursor in open space", 100, 200, "115px", "215px"],
    ["clamped at the right edge", 900, 200, "680px", "215px"],
    ["clamped at the bottom edge", 100, 790, "115px", "680px"],
    ["clamped in the bottom-right corner", 999, 799, "680px", "680px"],
    ["exactly on the clamp boundary", 665, 665, "680px", "680px"],
  ])("is %s (cursor %i, %i)", (_name, x, y, left, top) => {
    render(<PostHoverTooltip post={makePost()} x={x} y={y} viewport={viewport} />);
    const { style } = screen.getByTestId("post-tooltip");
    expect(style.left).toBe(left);
    expect(style.top).toBe(top);
  });

  it("does not intercept pointer events, so the bubble underneath stays hoverable", () => {
    render(<PostHoverTooltip post={makePost()} x={0} y={0} viewport={viewport} />);
    expect(screen.getByTestId("post-tooltip").style.pointerEvents).toBe("none");
  });

  it.each([
    ["a remote avatar through the image proxy", "https://cdn.example.com/a.png",
      `/api/image-proxy?url=${encodeURIComponent("https://cdn.example.com/a.png")}`],
    ["a same-origin avatar as-is", "/uploads/a.png", "/uploads/a.png"],
    ["the default avatar when the author has none", null,
      `/api/image-proxy?url=${encodeURIComponent("https://ui-avatars.com/api/?name=User")}`],
  ])("renders %s", (_name, profile_picture_url, expectedSrc) => {
    render(<PostHoverTooltip post={makePost({ profile_picture_url })} x={0} y={0} viewport={viewport} />);
    const img = screen.getByTestId("post-tooltip").querySelector("img");
    expect(img).toHaveAttribute("src", expectedSrc);
  });
});
