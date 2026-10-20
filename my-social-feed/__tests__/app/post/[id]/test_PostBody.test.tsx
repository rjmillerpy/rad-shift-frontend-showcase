import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PostBody from "@/app/post/[id]/PostBody";
import { DEFAULT_AVATAR } from "@/lib/config";
import type { Post } from "@/types/post";

jest.mock("next/link", () => {
  const Link = ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children);
  return Link;
});

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 42,
  text: "Detailed post content",
  username: "alice",
  likes: 10,
  laughs: 4,
  reposts: 3,
  shares: 5,
  saves: 2,
  replies_count: 6,
  quotes_count: 1,
  slop_count: 7,
  unix_timestamp: 1700000000,
  post_metadata: { tags: ["test", "demo"], tagged_users: ["bob", "carol"], location: "NYC" },
  ...overrides,
});

type Options = { token?: string | null; expandedMetadata?: boolean };

const setup = (post: Post = makePost(), options: Options = {}) => {
  const handlers = {
    onToggleMetadata: jest.fn(),
    onFollowToggle: jest.fn(),
    onToggleLike: jest.fn(),
    onRepost: jest.fn(),
    onShare: jest.fn(),
    onToggleSave: jest.fn().mockReturnValue(false),
    onToggleLaugh: jest.fn(),
    onMarkSlop: jest.fn(),
    onReport: jest.fn(),
    onQuote: jest.fn(),
    onToggleReplies: jest.fn(),
  };
  const utils = render(
    <PostBody
      post={post}
      token={options.token === undefined ? "test-token" : options.token}
      expandedMetadata={options.expandedMetadata ?? false}
      {...handlers}
    />,
  );
  return { ...handlers, ...utils };
};

const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

describe("PostBody content", () => {
  it("shows the author, text, timestamp and every count", () => {
    setup();
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute("href", "/profile/alice");
    expect(screen.getByText("Detailed post content")).toBeInTheDocument();
    expect(screen.getByText(new Date(1700000000 * 1000).toLocaleString())).toBeInTheDocument();
    for (const count of ["10", "4", "3", "5", "2", "6", "1", "7"]) {
      expect(screen.getByText(count)).toBeInTheDocument();
    }
  });

  test.each<[string, string | null, string]>([
    ["the default avatar", null, proxied(DEFAULT_AVATAR)],
    ["the author's remote picture through the proxy", "https://cdn.example.com/a.png", proxied("https://cdn.example.com/a.png")],
  ])("shows %s, linked to the profile", (_name, profile_picture_url, src) => {
    setup(makePost({ profile_picture_url }));
    const avatar = screen.getByAltText("Profile");
    expect(avatar).toHaveAttribute("src", src);
    expect(avatar.closest("a")).toHaveAttribute("href", "/profile/alice");
  });

  test.each<[string, string[] | undefined, string | null]>([
    ["several reposters", ["bob", "carol"], "Reposted by bob, carol"],
    ["no reposters", [], null],
    ["a missing reposter list", undefined, null],
  ])("handles %s", (_name, reposted_by, line) => {
    setup(makePost({ reposted_by }));
    if (line) expect(screen.getByText(line)).toBeInTheDocument();
    else expect(screen.queryByText(/^Reposted by/)).not.toBeInTheDocument();
  });

  it("links the quoted post", () => {
    setup(makePost({ quoted_post: { id: 7, username: "bob", text: "the earlier take" } }));
    const quote = screen.getByText("Quoting @bob").closest("a");
    expect(quote).toHaveAttribute("href", "/post/7");
    expect(quote).toHaveTextContent("❝the earlier take❞");
  });

  it("renders no quote or media for a plain text post", () => {
    const { container } = setup();
    expect(screen.queryByText(/^Quoting @/)).not.toBeInTheDocument();
    expect(screen.queryByAltText("Post")).not.toBeInTheDocument();
    expect(container.querySelector("video, audio")).toBeNull();
  });

  it("renders an attached image through the proxy", () => {
    setup(makePost({ image_url: "https://img.example.com/p.png" }));
    expect(screen.getByAltText("Post")).toHaveAttribute("src", proxied("https://img.example.com/p.png"));
  });

  test.each([
    ["video", { video_url: "https://cdn.example.com/clip.mp4" }, "https://cdn.example.com/clip.mp4"],
    ["audio", { audio_url: "https://cdn.example.com/track.mp3" }, "https://cdn.example.com/track.mp3"],
  ])("renders a %s player for an attached %s", (tag, media, src) => {
    const { container } = setup(makePost(media));
    const player = container.querySelector(tag);
    expect(player).toHaveAttribute("controls");
    expect(player?.querySelector("source")).toHaveAttribute("src", src);
  });
});

describe("PostBody follow button", () => {
  test.each<[string, string | null, boolean, boolean]>([
    ["a logged-in viewer on someone else's post", "tok", false, true],
    ["a logged-in viewer on their own post", "tok", true, false],
    ["a logged-out viewer", null, false, false],
  ])("for %s -> shown: %s", (_name, token, is_me, shown) => {
    setup(makePost({ is_me }), { token });
    expect(!!screen.queryByRole("button", { name: /^(Follow|Unfollow)$/ })).toBe(shown);
  });

  test.each([
    ["Follow", false],
    ["Unfollow", true],
    ["Follow", undefined],
  ])("'%s' reports the author and the current follow state (%s)", (name, is_followed_by_me) => {
    const { onFollowToggle } = setup(makePost({ is_followed_by_me }));
    fireEvent.click(screen.getByRole("button", { name }));
    expect(onFollowToggle).toHaveBeenCalledTimes(1);
    expect(onFollowToggle).toHaveBeenCalledWith("alice", !!is_followed_by_me);
  });
});

describe("PostBody metadata", () => {
  test.each<[string, boolean, Post["post_metadata"], boolean]>([
    ["expanded with metadata", true, { tags: ["test"], location: "NYC" }, true],
    ["collapsed with metadata", false, { tags: ["test"], location: "NYC" }, false],
    ["expanded with empty metadata", true, { tags: [], tagged_users: [] }, false],
    ["expanded with no metadata", true, undefined, false],
  ])("%s -> details shown: %s", (_name, expandedMetadata, post_metadata, shown) => {
    setup(makePost({ post_metadata }), { expandedMetadata });
    expect(screen.queryAllByText(/^(Tags|Tagged|Location):$/).length > 0).toBe(shown);
  });

  it("lists tags, tagged users and location when expanded", () => {
    setup(makePost(), { expandedMetadata: true });
    expect(screen.getByText("Tags:").parentElement).toHaveTextContent("Tags: test, demo");
    expect(screen.getByText("Tagged:").parentElement).toHaveTextContent("Tagged: bob, carol");
    expect(screen.getByText("Location:").parentElement).toHaveTextContent("Location: NYC");
  });

  it("omits the rows the post has no data for", () => {
    setup(makePost({ post_metadata: { location: "Berlin" } }), { expandedMetadata: true });
    expect(screen.getByText("Location:").parentElement).toHaveTextContent("Location: Berlin");
    expect(screen.queryByText("Tags:")).not.toBeInTheDocument();
    expect(screen.queryByText("Tagged:")).not.toBeInTheDocument();
  });

  test.each([
    ["offers", { location: "NYC" }, true],
    ["hides", {}, false],
  ])("%s the metadata toggle depending on whether there is metadata", (_name, post_metadata, shown) => {
    const { onToggleMetadata } = setup(makePost({ post_metadata }));
    const toggle = screen.queryByTitle("Toggle metadata");
    expect(!!toggle).toBe(shown);
    if (toggle) {
      fireEvent.click(toggle);
      expect(onToggleMetadata).toHaveBeenCalledTimes(1);
    }
  });
});

describe("PostBody actions", () => {
  test.each([
    ["Like", "onToggleLike"],
    ["Repost", "onRepost"],
    ["Laugh", "onToggleLaugh"],
    ["Share", "onShare"],
    ["Quote", "onQuote"],
    ["Show replies", "onToggleReplies"],
  ] as const)("'%s' calls %s with the post id", (title, handler) => {
    const handlers = setup();
    fireEvent.click(screen.getByTitle(title));
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
    expect(handlers[handler]).toHaveBeenCalledWith(42);
  });

  it("'Save' asks to toggle the save for this post", async () => {
    const { onToggleSave } = setup();
    await act(async () => { fireEvent.click(screen.getByTitle(/^Save/)); });
    expect(onToggleSave).toHaveBeenCalledTimes(1);
    expect(onToggleSave).toHaveBeenCalledWith(42);
  });

  test.each([
    ["Mark as Slop", "onMarkSlop", "onReport", "AI"],
    ["Report", "onReport", "onMarkSlop", "Harassment or Bullying"],
  ] as const)("'%s' opens its dialog and submits through %s", async (title, called, notCalled, reason) => {
    const handlers = setup();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle(title));
    expect(screen.getByRole("combobox")).toHaveValue(reason);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Submit/ })); });
    expect(handlers[called]).toHaveBeenCalledTimes(1);
    expect(handlers[called]).toHaveBeenCalledWith(42, reason);
    expect(handlers[notCalled]).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
