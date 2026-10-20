import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Constellation from "@/app/bubbles/Constellation";
import type { TopicDef } from "@/app/bubbles/types";
import type { Post } from "@/types/post";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1, text: "Post one", username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...overrides,
});
const makePosts = (n: number): Post[] =>
  Array.from({ length: n }, (_, i) => makePost({ id: i + 1, text: `Post number ${i + 1}`, username: `user${i + 1}` }));

// A topic with no micro-category chips, so the orbit is just controls + posts.
const custom: TopicDef = { label: "Knitting", color: "#123456" };
const tech: TopicDef = { label: "Technology", color: "#e74c3c" };
const IMG = "https://cdn.example.com/a.jpg";
const IMG2 = "https://cdn.example.com/b.jpg";

type Props = React.ComponentProps<typeof Constellation>;
const setup = (overrides: Partial<Props> = {}) => {
  const handlers = {
    setCarouselIndex: jest.fn(), onTopicClick: jest.fn(), onPostClick: jest.fn(), onBack: jest.fn(),
    onHome: jest.fn(), onPaginate: jest.fn(), onQuickAction: jest.fn(),
  };
  const utils = render(
    <Constellation
      selectedPost={null} selectedTopic={custom} posts={makePosts(2)} subcategories={[]}
      dimensions={{ w: 1000, h: 800 }} token={null} profilePic={null} loadingPosts={false}
      visitedTopics={new Set()} visitedPosts={new Set()} carouselIndex={{}}
      {...handlers} {...overrides}
    />,
  );
  return { ...utils, ...handlers };
};

const setViewport = (w: number, h: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: w });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: h });
};
const originalViewport = { w: window.innerWidth, h: window.innerHeight };

beforeEach(() => {
  jest.clearAllMocks();
  setViewport(1000, 800);
});
afterEach(() => {
  jest.restoreAllMocks();
  setViewport(originalViewport.w, originalViewport.h);
});

describe("Constellation — topic centre", () => {
  it("renders the centre, the three controls, the posts, and two lines per orbit item", () => {
    const { container } = setup();
    expect(screen.getByText("Knitting")).toBeInTheDocument();
    for (const title of ["Back", "🎈", "More", "Post number 1", "Post number 2"]) {
      expect(screen.getByTitle(title)).toBeInTheDocument();
    }
    expect(container.querySelectorAll("svg line")).toHaveLength(10);
  });

  it.each([
    ["Back", "onBack"],
    ["🎈", "onHome"],
    ["More", "onPaginate"],
  ] as const)("clicking the %s control calls %s", (title, handler) => {
    const handlers = setup();
    fireEvent.click(screen.getByTitle(title));
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
  });

  it("clicking a post bubble selects that post", () => {
    const posts = makePosts(2);
    const { onPostClick } = setup({ posts });
    fireEvent.click(screen.getByTitle("Post number 2"));
    expect(onPostClick).toHaveBeenCalledWith(posts[1]);
  });

  it("offers up to 3 capitalised subcategory chips and drills in as a non-feed topic", () => {
    const { onTopicClick } = setup({ subcategories: ["rust", "gaming", "linux", "extra"] });
    expect(screen.getByTitle("Rust")).toBeInTheDocument();
    expect(screen.getByTitle("Linux")).toBeInTheDocument();
    expect(screen.queryByTitle("Extra")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Gaming"));
    expect(onTopicClick).toHaveBeenCalledWith({ label: "Gaming", color: "#2ecc71", isFeed: false });
  });

  it("adds micro-category chips for a known topic", () => {
    const { onTopicClick } = setup({ selectedTopic: tech });
    fireEvent.click(screen.getByTitle("AI"));
    expect(onTopicClick).toHaveBeenCalledWith({ label: "AI", color: "#555", isFeed: false });
  });

  it.each([
    ["small viewport keeps the orbit sparse", 400, 400, 5],
    ["default viewport", 1000, 800, 17],
    ["huge viewport is capped", 3000, 2000, 21],
  ])("%s (%ix%i) shows %i of 30 posts", (_name, w, h, expected) => {
    setViewport(w, h);
    setup({ posts: makePosts(30), dimensions: { w, h } });
    expect(screen.getAllByTitle(/^Post number \d+$/)).toHaveLength(expected);
  });

  it.each([
    ["shown while loading", true],
    ["hidden otherwise", false],
  ])("loading message is %s", (_name, loadingPosts) => {
    setup({ loadingPosts });
    expect(screen.queryAllByText("Loading posts...")).toHaveLength(loadingPosts ? 1 : 0);
  });

  it.each([
    ["shown when logged in", "tok", 1],
    ["hidden when logged out", null, 0],
  ])("pinned profile bubble is %s", (_name, token, count) => {
    setup({ token });
    expect(screen.queryAllByTestId("zoomed-profile-bubble")).toHaveLength(count);
  });

  it("ticks topics and posts the user has already visited", () => {
    setup({ subcategories: ["Rust"], visitedTopics: new Set(["rust"]), visitedPosts: new Set([2]) });
    const ticked = screen.getAllByTestId("visited-indicator").map((el) => el.closest("button")?.title);
    expect(ticked.sort()).toEqual(["Post number 2", "Rust"]);
  });
});

describe("Constellation — post centre", () => {
  const selected = makePost({ id: 1, text: "Post number 1", post_metadata: { tags: ["rust", "gaming"] } });

  it("removes the centre post from the orbit and opens it on click", () => {
    setup({ selectedPost: selected, posts: makePosts(3) });
    const matches = screen.getAllByTitle("Post number 1");
    expect(matches).toHaveLength(1);
    fireEvent.click(matches[0]);
    expect(mockPush).toHaveBeenCalledWith("/post/1");
  });

  it("turns the post's tags into chips and drops duplicate subcategories", () => {
    setup({ selectedPost: selected, subcategories: ["Rust", "art"] });
    expect(screen.getAllByTitle("Rust")).toHaveLength(1);
    expect(screen.getByTitle("Gaming")).toBeInTheDocument();
    expect(screen.getByTitle("Art")).toBeInTheDocument();
  });

  it("truncates a long centre post but keeps the full text as its title", () => {
    const text = "word ".repeat(100).trim();
    setup({ selectedPost: makePost({ id: 99, text }), posts: [] });
    const centre = screen.getByTitle(text);
    expect(centre.textContent).toMatch(/…$/);
    expect(centre.textContent!.length).toBeLessThan(text.length);
  });

  it("advances the centre carousel through setCarouselIndex", () => {
    const { setCarouselIndex } = setup({
      selectedPost: makePost({ id: 9, image_url: IMG, image_urls: [IMG, IMG2] }), posts: [],
    });
    fireEvent.click(screen.getByTestId("center-carousel-next"));
    const updater = setCarouselIndex.mock.calls[0][0] as (prev: Record<number, number>) => Record<number, number>;
    expect(updater({ 3: 2 })).toEqual({ 3: 2, 9: 1 });
  });
});

describe("Constellation — hover tooltip and quick actions", () => {
  it("shows the tooltip while hovering a post and hides it on leave", () => {
    setup();
    const bubble = screen.getByTitle("Post number 1");
    fireEvent.mouseEnter(bubble, { clientX: 100, clientY: 100 });
    expect(screen.getByTestId("post-tooltip")).toHaveTextContent("@user1");
    fireEvent.mouseLeave(bubble);
    expect(screen.queryByTestId("post-tooltip")).not.toBeInTheDocument();
  });

  it.each([
    ["just under the deep-read time", 10_000, false],
    ["past the deep-read time", 10_001, true],
  ])("hovering %s (%ims) highlights=%s", (_name, hoveredMs, highlighted) => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    setup();
    const bubble = screen.getByTitle("Post number 1");
    const restingShadow = bubble.style.boxShadow;
    const otherShadow = screen.getByTitle("Post number 2").style.boxShadow;
    fireEvent.mouseEnter(bubble);
    now.mockReturnValue(1_000_000 + hoveredMs);
    fireEvent.mouseLeave(bubble);
    expect(screen.getByTitle("Post number 1").style.boxShadow !== restingShadow).toBe(highlighted);
    // Other posts are unaffected.
    expect(screen.getByTitle("Post number 2").style.boxShadow).toBe(otherShadow);
  });

  it("opens the quick-action menu at the cursor on right-click, runs the action, then closes", () => {
    const posts = makePosts(2);
    const { onQuickAction } = setup({ posts });
    expect(screen.queryByTestId("quick-action-menu")).not.toBeInTheDocument();
    fireEvent.contextMenu(screen.getByTitle("Post number 2"), { clientX: 50, clientY: 60 });
    const menu = screen.getByTestId("quick-action-menu");
    expect(menu.style.left).toBe("50px");
    expect(menu.style.top).toBe("60px");

    fireEvent.click(screen.getByTestId("quick-save"));
    expect(onQuickAction).toHaveBeenCalledWith("save", posts[1]);
    expect(screen.queryByTestId("quick-action-menu")).not.toBeInTheDocument();
  });

  it("opens the quick-action menu for the centre post and closes it on an outside click", () => {
    const { onQuickAction } = setup({ selectedPost: makePost({ id: 77, text: "Centre post" }) });
    fireEvent.contextMenu(screen.getByTitle("Centre post"), { clientX: 5, clientY: 6 });
    const menu = screen.getByTestId("quick-action-menu");
    fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId("quick-action-menu")).not.toBeInTheDocument();
    expect(onQuickAction).not.toHaveBeenCalled();
  });
});
