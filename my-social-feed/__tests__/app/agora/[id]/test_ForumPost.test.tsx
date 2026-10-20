import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ForumPost from "@/app/agora/[id]/ForumPost";
import type { ReactionAction } from "@/app/agora/constants";
import { DEFAULT_AVATAR } from "@/lib/config";
import type { Post } from "@/types/post";

jest.mock("next/link", () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children);
  return Link;
});

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 42,
  text: "Original post content",
  username: "alice",
  likes: 5,
  laughs: 3,
  reposts: 2,
  shares: 1,
  saves: 7,
  unix_timestamp: 1700000000,
  ...overrides,
});

type Flags = { index?: number; isOP?: boolean; canInteract?: boolean; isReplying?: boolean; replyText?: string };

const setup = (post: Post = makePost(), flags: Flags = {}) => {
  const handlers = {
    onReact: jest.fn(),
    onToggleReply: jest.fn(),
    onReplyTextChange: jest.fn(),
    onSubmitReply: jest.fn(),
    onCancelReply: jest.fn(),
    onQuote: jest.fn(),
    onSlop: jest.fn(),
  };
  const utils = render(
    <ForumPost
      post={post}
      index={flags.index ?? 0}
      isOP={flags.isOP ?? false}
      canInteract={flags.canInteract ?? true}
      isReplying={flags.isReplying ?? false}
      replyText={flags.replyText ?? ""}
      {...handlers}
    />,
  );
  return { ...handlers, ...utils };
};

const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

describe("ForumPost header and author", () => {
  it("shows the text, author link, permalink and position in the thread", () => {
    setup(makePost(), { index: 2 });
    expect(screen.getByTestId("forum-post-42")).toBeInTheDocument();
    expect(screen.getByText("Original post content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute("href", "/profile/alice");
    expect(screen.getByRole("link", { name: "#permalink" })).toHaveAttribute("href", "/post/42");
    const postedAt = new Date(1700000000 * 1000).toLocaleString();
    expect(screen.getByText(`#3 · Posted ${postedAt}`)).toBeInTheDocument();
  });

  test.each([
    ["the default avatar when the author has none", null, proxied(DEFAULT_AVATAR)],
    ["the author's remote picture through the proxy", "https://cdn.example.com/a.png", proxied("https://cdn.example.com/a.png")],
    ["a local picture as is", "/uploads/a.png", "/uploads/a.png"],
  ])("uses %s", (_name, profile_picture_url, src) => {
    const { container } = setup(makePost({ profile_picture_url }));
    expect(container.querySelector("img")).toHaveAttribute("src", src);
  });

  test.each([
    ["shows", true],
    ["hides", false],
  ])("%s the OP badge when isOP is %s", (_name, isOP) => {
    setup(makePost(), { isOP });
    expect(!!screen.queryByText("OP")).toBe(isOP);
  });
});

describe("ForumPost reactions", () => {
  test.each<[ReactionAction, Partial<Post>, string]>([
    ["like", { likes: 11 }, "11"],
    ["laugh", { laughs: 12 }, "12"],
    ["repost", { reposts: 13 }, "13"],
    ["save", { saves: 14 }, "14"],
  ])("the %s button shows its count and reports the reaction", (action, counts, shown) => {
    const { onReact } = setup(makePost(counts));
    const btn = screen.getByTestId(`react-${action}-42`);
    expect(btn).toHaveTextContent(shown);
    expect(btn).not.toHaveTextContent("✓");

    fireEvent.click(btn);
    expect(onReact).toHaveBeenCalledTimes(1);
    expect(onReact).toHaveBeenCalledWith(42, action);
  });

  test.each<[ReactionAction, Partial<Post>]>([
    ["like", { liked_by_me: true }],
    ["laugh", { laughed_by_me: true }],
    ["repost", { reposted_by_me: true }],
    ["save", { saved_by_me: true }],
  ])("only the %s button is check-marked when it is the viewer's reaction", (action, flags) => {
    setup(makePost(flags));
    for (const other of ["like", "laugh", "repost", "save"]) {
      const text = screen.getByTestId(`react-${other}-42`).textContent ?? "";
      expect(text.includes("✓")).toBe(other === action);
    }
  });

  it("shows zero laughs when the post carries no laugh count", () => {
    setup(makePost({ laughs: undefined as unknown as number }));
    expect(screen.getByTestId("react-laugh-42")).toHaveTextContent(/\b0\b/);
  });
});

describe("ForumPost actions", () => {
  test.each([
    ["reply-btn-42", "onToggleReply"],
    ["quote-btn-42", "onQuote"],
    ["slop-btn-42", "onSlop"],
  ] as const)("%s calls %s with the post id", (testId, handler) => {
    const handlers = setup();
    fireEvent.click(screen.getByTestId(testId));
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
    expect(handlers[handler]).toHaveBeenCalledWith(42);
  });

  it("disables slop for logged-out viewers but keeps reply and quote clickable", () => {
    const { onSlop, onQuote, onToggleReply } = setup(makePost(), { canInteract: false });
    const slop = screen.getByTestId("slop-btn-42");
    expect(slop).toBeDisabled();
    fireEvent.click(slop);
    expect(onSlop).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("quote-btn-42"));
    fireEvent.click(screen.getByTestId("reply-btn-42"));
    expect(onQuote).toHaveBeenCalledWith(42);
    expect(onToggleReply).toHaveBeenCalledWith(42);
  });

  it("enables slop for logged-in viewers", () => {
    setup(makePost(), { canInteract: true });
    expect(screen.getByTestId("slop-btn-42")).toBeEnabled();
  });
});

describe("ForumPost reply box", () => {
  test.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])("isReplying=%s canInteract=%s -> box shown: %s", (isReplying, canInteract, shown) => {
    setup(makePost(), { isReplying, canInteract });
    expect(!!screen.queryByTestId("reply-box-42")).toBe(shown);
  });

  it("shows the draft and reports typing", () => {
    const { onReplyTextChange } = setup(makePost(), { isReplying: true, replyText: "draft so far" });
    const input = screen.getByTestId("reply-input-42");
    expect(input).toHaveValue("draft so far");
    fireEvent.change(input, { target: { value: "draft so far!" } });
    expect(onReplyTextChange).toHaveBeenCalledWith(42, "draft so far!");
  });

  test.each([
    ["Post Reply", "onSubmitReply", "onCancelReply"],
    ["Cancel", "onCancelReply", "onSubmitReply"],
  ] as const)("'%s' calls %s only", (name, called, notCalled) => {
    const handlers = setup(makePost(), { isReplying: true, replyText: "hello" });
    fireEvent.click(screen.getByRole("button", { name }));
    expect(handlers[called]).toHaveBeenCalledTimes(1);
    expect(handlers[called]).toHaveBeenCalledWith(42);
    expect(handlers[notCalled]).not.toHaveBeenCalled();
  });
});

describe("ForumPost media", () => {
  const bodyImages = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("img")).slice(1).map((img) => img.getAttribute("src"));

  it("renders no media for a text-only post", () => {
    const { container } = setup();
    expect(bodyImages(container)).toEqual([]);
    expect(container.querySelector("video, audio")).toBeNull();
    expect(screen.queryByTestId("image-gallery")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Quoting @/)).not.toBeInTheDocument();
  });

  test.each<[string, Partial<Post>]>([
    ["only image_url", { image_url: "https://img.example.com/one.png" }],
    ["image_url plus a one-item image_urls", { image_url: "https://img.example.com/one.png", image_urls: ["https://img.example.com/one.png"] }],
  ])("renders a single image for %s", (_name, media) => {
    const { container } = setup(makePost(media));
    expect(bodyImages(container)).toEqual(["https://img.example.com/one.png"]);
    expect(screen.queryByTestId("image-gallery")).not.toBeInTheDocument();
  });

  it("renders a gallery instead of the single image when there are several", () => {
    const image_urls = ["https://img.example.com/1.png", "https://img.example.com/2.png", "https://img.example.com/3.png"];
    const { container } = setup(makePost({ image_url: image_urls[0], image_urls }));
    expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
    for (let i = 0; i < image_urls.length; i++) {
      expect(screen.getByTestId(`gallery-image-${i}`)).toBeInTheDocument();
    }
    expect(bodyImages(container)).toHaveLength(image_urls.length);
  });

  test.each([
    ["video", { video_url: "https://cdn.example.com/clip.mp4" }, "https://cdn.example.com/clip.mp4"],
    ["audio", { audio_url: "https://cdn.example.com/track.mp3" }, "https://cdn.example.com/track.mp3"],
  ])("renders a %s player with controls", (tag, media, src) => {
    const { container } = setup(makePost(media));
    const player = container.querySelector(tag);
    expect(player).toHaveAttribute("src", src);
    expect(player).toHaveAttribute("controls");
    expect(container.querySelector(tag === "video" ? "audio" : "video")).toBeNull();
  });

  it("renders the quoted post with its author", () => {
    setup(makePost({ quoted_post: { id: 7, username: "bob", text: "the earlier take" } }));
    expect(screen.getByText("Quoting @bob:")).toBeInTheDocument();
    expect(screen.getByText("the earlier take")).toBeInTheDocument();
  });
});
