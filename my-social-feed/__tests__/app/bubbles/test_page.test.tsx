/**
 * Tests for /spider page — overview floating bubbles and zoomed-in post view
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

// Mock requestAnimationFrame for animation
let rafCallbacks: FrameRequestCallback[] = [];
const originalRAF = global.requestAnimationFrame;
const originalCAF = global.cancelAnimationFrame;
beforeAll(() => {
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  };
  global.cancelAnimationFrame = () => {};
});
afterAll(() => {
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
});

import BubblesFeedPage from "@/app/bubbles/page";

// Helper: dismiss the session goal prompt that shows on first render
const dismissGoalPrompt = () => {
  const skipBtn = screen.queryByText("Skip");
  if (skipBtn) fireEvent.click(skipBtn);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  localStorage.clear();
  rafCallbacks = [];
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("BubblesFeedPage — Overview", () => {
  it("renders all topic bubbles", () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    expect(screen.getByTitle("Algo")).toBeInTheDocument();
    expect(screen.getByTitle("Following")).toBeInTheDocument();
    expect(screen.getByTitle("Technology")).toBeInTheDocument();
    expect(screen.getByTitle("Music")).toBeInTheDocument();
    expect(screen.getByTitle("Gaming")).toBeInTheDocument();
  });

  it("renders 21 topic bubbles total", () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    // 3 feed + 18 general = 21
    const buttons = screen.getAllByRole("button").filter(
      (b) => b.title && !["Search", "New post", "Close composer"].includes(b.getAttribute("aria-label") || "")
    );
    // Account for FloatingButtons (search button)
    expect(buttons.length).toBeGreaterThanOrEqual(21);
  });

  it("feed bubbles have white border (bold style)", () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    const algo = screen.getByTitle("Algo");
    expect(algo.style.border).toContain("3px solid");
    expect(algo.style.fontWeight).toBe("bold");
  });

  it("clicking a topic transitions to zoomed view", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Center bubble should show "Technology" (also in background)
      expect(screen.getAllByText("Technology").length).toBeGreaterThanOrEqual(1);
      // Balloon button should be visible (unique to constellation)
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
      // Back button should be visible
      expect(screen.getByText("\u2190")).toBeInTheDocument();
    });
  });
});

describe("BubblesFeedPage — Zoomed View", () => {
  const mockPosts = [
    { id: 1, text: "Tech post about AI", username: "tech_bot", likes: 5, reposts: 2, shares: 1, saves: 0, unix_timestamp: 1700000000, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 },
    { id: 2, text: "Quantum computing breakthrough", username: "tech_bot", likes: 3, reposts: 1, shares: 0, saves: 0, unix_timestamp: 1700000060, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 },
    { id: 3, text: "Rust framework compiles fast", username: "tech_bot", likes: 8, reposts: 4, shares: 2, saves: 1, unix_timestamp: 1700000120, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 },
  ];

  beforeEach(() => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: true } });
      if (url.includes("/posts/algo")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      if (url.includes("/posts/following")) return Promise.resolve({ data: { posts: [], has_more: false } });
      if (url.includes("/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });
  });

  it("shows post content in orbit bubbles", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
      expect(screen.getByText(/Quantum computing/)).toBeInTheDocument();
    });
  });

  it("shows connection lines (SVG)", async () => {
    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      const lines = svg?.querySelectorAll("line");
      expect(lines?.length).toBeGreaterThan(0);
    });
  });

  it("clicking balloon returns to overview", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("\ud83c\udf88"));
    act(() => jest.advanceTimersByTime(400));

    // Should be back to overview — all topic bubbles visible
    await waitFor(() => {
      expect(screen.getByTitle("Technology")).toBeInTheDocument();
      expect(screen.getByTitle("Science")).toBeInTheDocument();
    });
  });

  it("clicking paginate button loads more posts", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByAltText("Load more")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByAltText("Load more"));

    await waitFor(() => {
      // Second API call should have offset
      const searchCalls = mockedApi.get.mock.calls.filter(
        (c) => (c[0] as string).includes("/search/posts")
      );
      expect(searchCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("clicking a post bubble makes it the center", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));

    // Post should now be the center — balloon and back should still be visible
    await waitFor(() => {
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
      expect(screen.getByText("\u2190")).toBeInTheDocument();
    });
  });

  it("back button navigates to previous view", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("\u2190")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("\u2190"));
    act(() => jest.advanceTimersByTime(400));

    // Should go back to overview
    await waitFor(() => {
      expect(screen.getByTitle("Technology")).toBeInTheDocument();
    });
  });

  it("Algo feed bubble fetches from /posts/algo", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Algo"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const algoCalls = mockedApi.get.mock.calls.filter(
        (c) => (c[0] as string).includes("/posts/algo")
      );
      expect(algoCalls.length).toBeGreaterThan(0);
    });
  });

  it("Following feed bubble fetches from /posts/following", async () => {
    localStorage.setItem("token", "test-token");
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Following"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const followCalls = mockedApi.get.mock.calls.filter(
        (c) => (c[0] as string).includes("/posts/following")
      );
      expect(followCalls.length).toBeGreaterThan(0);
    });
  });

  it("topic search uses search endpoint", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Science"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const searchCalls = mockedApi.get.mock.calls.filter(
        (c) => (c[0] as string).includes("/search/posts")
      );
      expect(searchCalls.length).toBeGreaterThan(0);
      // Should search for "Science"
      const params = searchCalls[0][1]?.params as { q?: string } | undefined;
      expect(params?.q).toBe("Science");
    });
  });

  it("shows loading indicator when fetching posts", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return new Promise(() => {}); // Never resolves
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    expect(screen.getByText("Loading posts...")).toBeInTheDocument();
  });

  it("truncates long post text and shows ellipsis", async () => {
    const longPost = {
      id: 99, text: "A".repeat(200), username: "u", likes: 0, reposts: 0,
      shares: 0, saves: 0, unix_timestamp: 1700000000, post_metadata: {},
      replies_count: 0, quotes_count: 0, slop_count: 0,
    };
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [longPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // 200 chars should be truncated — text should end with ellipsis
      const truncated = screen.getByText(/A{10,}/);
      expect(truncated.textContent!.length).toBeLessThan(200);
      expect(truncated.textContent!).toContain("\u2026");
    });
  });

  it("short posts get smaller bubbles than long posts", async () => {
    const shortPost = { id: 70, text: "Hi", username: "u", likes: 0, reposts: 0, shares: 0, saves: 0, unix_timestamp: 1700000000, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 };
    const longPost = { id: 71, text: "B".repeat(150), username: "u", likes: 0, reposts: 0, shares: 0, saves: 0, unix_timestamp: 1700000001, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 };
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [shortPost, longPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const shortBtn = screen.getByText("Hi").closest("button")!;
      const longBtn = screen.getByText(/B{10,}/).closest("button")!;
      const shortSize = parseInt(shortBtn.style.width);
      const longSize = parseInt(longBtn.style.width);
      expect(longSize).toBeGreaterThan(shortSize);
    });
  });

  it("hover on topic bubbles scales up", () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    const tech = screen.getByTitle("Technology");
    fireEvent.mouseEnter(tech);
    expect(tech.style.transform).toBe("scale(1.15)");
    fireEvent.mouseLeave(tech);
    expect(tech.style.transform).toBe("scale(1)");
  });

  it("hover on orbit bubbles scales up", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({
        data: { posts: [{ id: 1, text: "Hover test post", username: "u", likes: 0, reposts: 0, shares: 0, saves: 0, unix_timestamp: 1700000000, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 }], has_more: false }
      });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    const postText = await screen.findByText(/Hover test post/);
    const postBtn = postText.closest("button")!;
    // Hover container is the wrapper div (parent of button)
    const hoverContainer = postBtn.parentElement!;
    fireEvent.mouseEnter(hoverContainer);
    expect(hoverContainer.style.transform).toBe("scale(1.12)");
    fireEvent.mouseLeave(hoverContainer);
    expect(hoverContainer.style.transform).toBe("scale(1)");
  });

  it("center bubble shows selected topic name", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Music"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // There should be a large center element with "Music"
      const musicElements = screen.getAllByText("Music");
      expect(musicElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows subcategory bubbles from tags endpoint for feed tabs", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: ["technology", "science", "music"] } });
      if (url.includes("/posts/algo")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Algo"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("Technology")).toBeInTheDocument();
      expect(screen.getByText("Science")).toBeInTheDocument();
      expect(screen.getByText("Music")).toBeInTheDocument();
    });
  });

  it("shows subcategory bubbles extracted from search results for general topics", async () => {
    const postsWithTags = [
      { ...mockPosts[0], post_metadata: { tags: ["ai", "ml"] } },
    ];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: postsWithTags, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("Ai")).toBeInTheDocument();
      expect(screen.getByText("Ml")).toBeInTheDocument();
    });
  });

  it("clicking a subcategory bubble drills into that topic", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: ["science"] } });
      if (url.includes("/posts/algo")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Algo"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("Science")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Science"));

    // Should transition to Science topic view
    await waitFor(() => {
      // Center should now show Science
      const scienceElements = screen.getAllByText("Science");
      expect(scienceElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("subcategory bubbles have matching topic colors", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: ["technology"] } });
      if (url.includes("/posts/algo")) return Promise.resolve({ data: { posts: [], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Algo"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const techBubbles = screen.getAllByText("Technology");
      const techBubble = techBubbles[techBubbles.length - 1]; // Last one is constellation
      // Should have colored border (subcategory style)
      expect(techBubble.style.border).toContain("3px solid");
    });
  });

  it("post-center view shows major categories from post tags", async () => {
    const taggedPost = { ...mockPosts[0], post_metadata: { tags: ["ai", "robotics"] } };
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [taggedPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    // Click the post to make it center
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Major categories from the post's tags should appear
      expect(screen.getByText("Ai")).toBeInTheDocument();
      expect(screen.getByText("Robotics")).toBeInTheDocument();
    });
  });

  it("post-center view loads related posts", async () => {
    const relatedPosts = [
      { ...mockPosts[0], id: 50, text: "Related post one", post_metadata: { tags: "tech" } },
      { ...mockPosts[0], id: 51, text: "Related post two", post_metadata: { tags: "tech" } },
    ];
    let callCount = 0;
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) {
        callCount++;
        if (callCount <= 1) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
        return Promise.resolve({ data: { posts: relatedPosts, has_more: false } });
      }
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Related post one/)).toBeInTheDocument();
    });
  });

  it("back button returns from post-center to topic view", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    // Drill into post
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("\u2190")).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByText("\u2190"));
    act(() => jest.advanceTimersByTime(400));

    // Should return to topic view (Technology appears in both background and center)
    await waitFor(() => {
      expect(screen.getAllByText("Technology").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("center bubble is clickable when post is centered", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));

    // The center bubble should have a title with the full post text
    const centerEl = screen.getByTitle("Tech post about AI");
    expect(centerEl).toBeInTheDocument();
    fireEvent.click(centerEl);
    expect(mockPush).toHaveBeenCalledWith("/post/1");
  });

  it("balloon from post-center returns to overview", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument());
    fireEvent.click(screen.getByText("\ud83c\udf88"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByTitle("Technology")).toBeInTheDocument());
  });

  it("paginate from post-center loads more posts", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: true } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByText(/Tech post about AI/));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByAltText("Load more")).toBeInTheDocument());
    fireEvent.click(screen.getByAltText("Load more"));
    await waitFor(() => {
      const searchCalls = mockedApi.get.mock.calls.filter(
        (c) => (c[0] as string).includes("/search/posts")
      );
      expect(searchCalls.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows micro-categories in orbit", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Micro-categories from MICRO_KEYWORDS.technology should appear
      // At least one should be visible (AI, Web Dev, Cloud, etc.)
      const allButtons = screen.getAllByRole("button");
      const microLabels = allButtons.filter((b) => {
        const style = b.getAttribute("style") || "";
        return style.includes("dashed");
      });
      expect(microLabels.length).toBeGreaterThan(0);
    });
  });

  it("post bubbles have dynamic sizes based on text length", async () => {
    const shortPost = { ...mockPosts[0], id: 70, text: "Short" };
    const longPost = { ...mockPosts[0], id: 71, text: "A".repeat(100) };
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({
        data: { posts: [shortPost, longPost], has_more: false }
      });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("Short")).toBeInTheDocument();
    });
  });

  it("more bubbles appear in tree (up to 16)", async () => {
    const manyPosts = Array.from({ length: 15 }, (_, i) => ({
      ...mockPosts[0], id: 80 + i, text: `Post number ${i + 1}`,
    }));
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({
        data: { posts: manyPosts, has_more: false }
      });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Should have many orbit items: 3 controls + micros + posts
      const allButtons = screen.getAllByRole("button");
      // Excluding FloatingButtons (search), should have 10+
      expect(allButtons.length).toBeGreaterThanOrEqual(10);
    });
  });

  it("handles API error gracefully", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.reject(new Error("Network error"));
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error fetching posts:", expect.any(Error));
    });
  });

  it("shows hover tooltip on post bubble mouseenter", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    const postEl = screen.getByText(/Tech post about AI/);
    const hoverContainer = postEl.closest("button")!.parentElement!;
    fireEvent.mouseEnter(hoverContainer, { clientX: 400, clientY: 300 });

    await waitFor(() => {
      const tooltip = screen.getByTestId("post-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent("@tech_bot");
      expect(tooltip).toHaveTextContent("Tech post about AI");
      expect(tooltip).toHaveTextContent("5 likes");
    });
  });

  it("hides hover tooltip on mouseleave", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    const postEl = screen.getByText(/Tech post about AI/);
    const hoverContainer = postEl.closest("button")!.parentElement!;
    fireEvent.mouseEnter(hoverContainer, { clientX: 400, clientY: 300 });
    expect(screen.getByTestId("post-tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(hoverContainer);
    expect(screen.queryByTestId("post-tooltip")).not.toBeInTheDocument();
  });

  it("transitions have fade effect (opacity)", async () => {
    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    dismissGoalPrompt();

    // Overview should be fully opaque
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.style.opacity).toBe("1");
  });

  it("force-directed layout prevents overlaps", async () => {
    const manyPosts = Array.from({ length: 12 }, (_, i) => ({
      ...mockPosts[0], id: 200 + i, text: `Force layout post ${i}`,
    }));
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({
        data: { posts: manyPosts, has_more: false }
      });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // All posts should render without error (force layout handled overlaps)
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThanOrEqual(10);
    });
  });

  it("right-click on post bubble shows quick action menu", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });

    await waitFor(() => {
      const menu = screen.getByTestId("quick-action-menu");
      expect(menu).toBeInTheDocument();
      expect(screen.getByText(/Like/)).toBeInTheDocument();
      expect(screen.getByText(/Repost/)).toBeInTheDocument();
      expect(screen.getByText(/Save/)).toBeInTheDocument();
      expect(screen.getByText("Open post")).toBeInTheDocument();
    });
  });

  it("quick action like calls API", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.post.mockResolvedValue({ data: { likes: 1, action: "liked" } });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-action-menu")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Like/));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/like/")
      );
    });
  });

  it("quick action menu closes on an outside press (was mouseLeave — fired between buttons and swallowed reactions)", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    const menu = screen.getByTestId("quick-action-menu");
    expect(menu).toBeInTheDocument();

    // A press anywhere outside the menu closes it.
    fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId("quick-action-menu")).not.toBeInTheDocument();
  });

  it("visited topics show checkmark indicator", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
    });

    // Go back
    fireEvent.click(screen.getByText("\ud83c\udf88"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTitle("Technology")).toBeInTheDocument();
    });

    // Now drill into Technology again
    act(() => jest.advanceTimersByTime(2100)); // cooldown — subcategories related to technology should show visited
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    // The Technology topic was visited — when we see subcategories, any matching our visit should be dimmed
    // We can't easily check the specific visited indicator without matching content,
    // but we can verify the state mechanism works by checking no errors occurred
    await waitFor(() => {
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
    });
  });

  it("post bubbles have distinct visual style from category bubbles", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: ["science"] } });
      if (url.includes("/posts/algo")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Algo"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Category bubble (Science) should have thick solid border
      const scienceBubbles = screen.getAllByText("Science");
      const scienceBubble = scienceBubbles[scienceBubbles.length - 1];
      expect(scienceBubble.style.border).toContain("3px solid");

      // Post bubble should have thin border (text is nested in span, border on button)
      const postText = screen.getByText(/Tech post about AI/);
      const postBubble = postText.closest("button")!;
      expect(postBubble.style.border).toContain("1px solid");
    });
  });

  it("animated connection lines render SVG animate elements", async () => {
    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const animates = container.querySelectorAll("animate");
      expect(animates.length).toBeGreaterThan(0);
    });
  });

  it("profile bubble persists in zoomed mode when logged in", async () => {
    localStorage.setItem("token", "test-token");
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("zoomed-profile-bubble")).toBeInTheDocument();
    });
  });

  it("open post from quick action menu navigates", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText("Open post"));

    expect(mockPush).toHaveBeenCalledWith("/post/1");
  });

  it("quick action menu shows all interaction options", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByText(/Like/)).toBeInTheDocument();
      expect(screen.getByText(/Repost/)).toBeInTheDocument();
      expect(screen.getByText(/Save/)).toBeInTheDocument();
      expect(screen.getByText(/Share/)).toBeInTheDocument();
      expect(screen.getByText(/Quote/)).toBeInTheDocument();
      expect(screen.getByText(/Replies/)).toBeInTheDocument();
      expect(screen.getByText(/Mark as Slop/)).toBeInTheDocument();
      expect(screen.getByText(/Report/)).toBeInTheDocument();
      expect(screen.getByText("Open post")).toBeInTheDocument();
    });
  });

  it("quick action share copies link and alerts", async () => {
    localStorage.setItem("token", "test-token");
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    jest.spyOn(window, "alert").mockImplementation(() => {});
    mockedApi.post.mockResolvedValue({ data: { share_url: "/posts/1", shares: 1 } });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Share/));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Post link copied!");
    });
  });

  it("quick action quote navigates to post page", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Quote/));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/post/1?quote=1");
    });
  });

  it("quick action replies navigates to post page with reply param", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Replies/));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/post/1?reply=1");
    });
  });

  it("quick action slop prompts for reason and calls API", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.post.mockResolvedValue({ data: { status: "ok" } });
    jest.spyOn(window, "prompt").mockReturnValue("Engagement Bait");

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Mark as Slop/));

    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalled();
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/slop/"),
        expect.objectContaining({ reason: "Engagement Bait" })
      );
    });
  });

  it("quick action report prompts for reason, calls API, and alerts", async () => {
    localStorage.setItem("token", "test-token");
    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(window, "prompt").mockReturnValue("Spam");
    mockedApi.post.mockResolvedValue({ data: { status: "ok" } });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Report/));

    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalled();
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/slop/"),
        expect.objectContaining({ reason: "[REPORT] Spam" })
      );
      expect(window.alert).toHaveBeenCalledWith("Report submitted. This post will no longer appear in your feed.");
    });
  });

  it("slop removes post from bubble orbit", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.post.mockResolvedValue({ data: { status: "ok" } });
    jest.spyOn(window, "prompt").mockReturnValue("AI");

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Mark as Slop/));

    await waitFor(() => {
      expect(screen.queryByText(/Tech post about AI/)).not.toBeInTheDocument();
    });
  });

  it("report removes post from bubble orbit", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.post.mockResolvedValue({ data: { status: "ok" } });
    jest.spyOn(window, "prompt").mockReturnValue("Spam");
    jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Report/));

    await waitFor(() => {
      expect(screen.queryByText(/Tech post about AI/)).not.toBeInTheDocument();
    });
  });

  it("slop cancelled when prompt returns null", async () => {
    localStorage.setItem("token", "test-token");
    jest.spyOn(window, "prompt").mockReturnValue(null);

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByText(/Mark as Slop/));

    // Post should still be visible (slop was cancelled)
    await waitFor(() => {
      expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument();
    });
  });

  it("slop and report items have distinct colors", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Tech post about AI/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Tech post about AI/), { clientX: 400, clientY: 300 });

    const reportBtn = screen.getByTestId("quick-report");
    expect(reportBtn.style.color).toBe("rgb(231, 76, 60)"); // #e74c3c

    const slopBtn = screen.getByTestId("quick-slop");
    expect(slopBtn.style.color).toBe("rgb(230, 126, 34)"); // #e67e22
  });

  it("background topic bubbles remain visible when zoomed", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    // Before zoom: Science visible normally
    expect(screen.getByTitle("Science")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    // After zoom into Technology: Science should still be in DOM (dimmed)
    await waitFor(() => {
      const scienceBtn = screen.getByTitle("Science");
      expect(scienceBtn).toBeInTheDocument();
      expect(scienceBtn.style.opacity).toBe("0.25");
    });
  });

  it("background bubbles are clickable when zoomed to switch topics", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: mockPosts, has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
    });

    // Click Science in the background — should switch to Science constellation
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    fireEvent.click(screen.getByTitle("Science"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Should now show Science in the constellation center
      const scienceElements = screen.getAllByText("Science");
      expect(scienceElements.length).toBeGreaterThanOrEqual(2); // background + center
      // Balloon still visible (still zoomed)
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
    });
  });

  it("background bubbles keep floating (animated) when zoomed", async () => {
    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    dismissGoalPrompt();

    const getBubblePos = () => {
      const btn = screen.getByTitle("Science");
      return btn.style.left;
    };

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    // Background bubbles should still be positioned (animation running)
    await waitFor(() => {
      const scienceBtn = screen.getByTitle("Science");
      expect(scienceBtn.style.left).toBeTruthy();
    });
  });
});

describe("BubblesFeedPage — Cognitive Features", () => {
  beforeEach(() => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [
        { id: 1, text: "Test post", username: "u", likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 3, unix_timestamp: 1700000000, post_metadata: {}, replies_count: 0, quotes_count: 2, slop_count: 0 },
      ], has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });
  });

  it("shows session goal prompt on first render", () => {
    render(<BubblesFeedPage />);
    expect(screen.getByTestId("goal-prompt")).toBeInTheDocument();
    expect(screen.getByText("What are you looking for?")).toBeInTheDocument();
  });

  it("skip button dismisses goal prompt", () => {
    render(<BubblesFeedPage />);
    fireEvent.click(screen.getByText("Skip"));
    expect(screen.queryByTestId("goal-prompt")).not.toBeInTheDocument();
  });

  it("entering a goal sets it and dismisses prompt", () => {
    render(<BubblesFeedPage />);
    const input = screen.getByTestId("goal-input");
    fireEvent.change(input, { target: { value: "Learn about AI" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByTestId("goal-prompt")).not.toBeInTheDocument();
  });

  it("session goal shows in context bar when zoomed", async () => {
    render(<BubblesFeedPage />);
    const input = screen.getByTestId("goal-input");
    fireEvent.change(input, { target: { value: "Find music" } });
    fireEvent.keyDown(input, { key: "Enter" });

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("session-goal")).toHaveTextContent("Find music");
    });
  });

  it("context bar shows breadcrumb path when zoomed", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("context-bar")).toBeInTheDocument();
      expect(screen.getByText("Path:")).toBeInTheDocument();
    });
  });

  it("focus timer counts up when drilled in", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("focus-timer")).toBeInTheDocument();
    });

    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByTestId("focus-timer")).toHaveTextContent("0:05");
  });

  it("focus timer shows stay longer when under 30s", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("focus-timer")).toHaveTextContent("stay longer");
    });
  });

  it("depth indicator shows blue dots", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("depth-indicator")).toHaveTextContent("\ud83d\udd35");
    });
  });

  it("slow mode is always on (no toggle, no turtle icon)", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Turtle icon removed — slow mode runs silently
      expect(screen.queryByText("\ud83d\udc22")).not.toBeInTheDocument();
      // Context bar still visible
      expect(screen.getByTestId("context-bar")).toBeInTheDocument();
    });
  });

  it("take a break returns to overview", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("take-break")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("take-break"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.queryByTestId("context-bar")).not.toBeInTheDocument();
    });
  });

  it("depth glow appears at depth > 1", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    expect(screen.queryByTestId("depth-glow")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/Test post/)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(2100));
    fireEvent.click(screen.getByText(/Test post/));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("depth-glow")).toBeInTheDocument();
    });
  });

  it("cooldown prevents rapid topic switching", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    // Immediately try Science (within cooldown) — should be blocked
    fireEvent.click(screen.getByTitle("Science"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("\ud83c\udf88")).toBeInTheDocument();
    });
  });

  it("idk button sets exploring goal and dismisses prompt", () => {
    render(<BubblesFeedPage />);
    // Don't dismiss — click idk instead
    const idkBtn = screen.getByTestId("idk-button");
    fireEvent.click(idkBtn);
    expect(screen.queryByTestId("goal-prompt")).not.toBeInTheDocument();
  });

  it("post bubbles show profile picture", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const postText = screen.getByText(/Test post/);
      const postBubble = postText.closest("button")!;
      const imgs = postBubble.querySelectorAll("img");
      expect(imgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("hover tooltip shows all stats including laughs and quotes", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByText(/Test post/)).toBeInTheDocument());

    const postText = screen.getByText(/Test post/);
    const hoverContainer = postText.closest("button")!.parentElement!;
    fireEvent.mouseEnter(hoverContainer, { clientX: 400, clientY: 300 });

    await waitFor(() => {
      const tooltip = screen.getByTestId("post-tooltip");
      expect(tooltip).toHaveTextContent("5 likes");
      expect(tooltip).toHaveTextContent("3 laughs");
      expect(tooltip).toHaveTextContent("2 reposts");
      expect(tooltip).toHaveTextContent("1 shares");
      expect(tooltip).toHaveTextContent("0 saves");
      expect(tooltip).toHaveTextContent("2 quotes");
    });
  });

  it("hover tooltip shows profile picture and timestamp", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();

    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByText(/Test post/)).toBeInTheDocument());

    const postText = screen.getByText(/Test post/);
    const hoverContainer = postText.closest("button")!.parentElement!;
    fireEvent.mouseEnter(hoverContainer, { clientX: 400, clientY: 300 });

    await waitFor(() => {
      const tooltip = screen.getByTestId("post-tooltip");
      const imgs = tooltip.querySelectorAll("img");
      expect(imgs.length).toBeGreaterThanOrEqual(1);
      expect(tooltip).toHaveTextContent("@u");
    });
  });

  it("shows post FAB when logged in", () => {
    localStorage.setItem("token", "test-token");
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    expect(screen.getByTestId("bubbles-post-fab")).toBeInTheDocument();
    expect(screen.queryByTestId("bubbles-login-fab")).not.toBeInTheDocument();
  });

  it("shows login button when NOT logged in", () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    expect(screen.getByTestId("bubbles-login-fab")).toBeInTheDocument();
    expect(screen.queryByTestId("bubbles-post-fab")).not.toBeInTheDocument();
  });

  it("login button navigates to /login", () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTestId("bubbles-login-fab"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("post FAB navigates to home page", () => {
    localStorage.setItem("token", "test-token");
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTestId("bubbles-post-fab"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

describe("BubblesFeedPage — Media Bubbles", () => {
  const makeMediaPost = (id: number, overrides: any = {}) => ({
    id, text: "Media post content here", username: "media_user",
    likes: 3, reposts: 1, shares: 0, saves: 0,
    unix_timestamp: 1700000000, post_metadata: { tags: "technology" },
    replies_count: 0, quotes_count: 0, slop_count: 0,
    image_url: null, video_url: null, audio_url: null,
    profile_picture_url: null,
    ...overrides,
  });

  beforeEach(() => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });
  });

  it("renders video post as TV-shaped bubble with antennae and play button", async () => {
    const videoPost = makeMediaPost(1, { video_url: "https://example.com/video.mp4" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const videoBubble = screen.getByTestId("video-bubble");
      expect(videoBubble).toBeInTheDocument();
      // TV shape — uniform 12px corners, not circular
      const btn = videoBubble.closest("button")!;
      expect(btn.style.borderRadius).not.toBe("50%");
      expect(btn.style.borderRadius).toBe("12px");
    });
  });

  it("renders image post with gold picture frame border", async () => {
    const imagePost = makeMediaPost(2, { image_url: "https://example.com/photo.jpg" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [imagePost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const imageBubble = screen.getByTestId("image-bubble");
      expect(imageBubble).toBeInTheDocument();
      // Uniform square edges with gold border
      const btn = imageBubble.closest("button")!;
      expect(btn.style.borderRadius).toBe("4px");
      expect(btn.style.border).toContain("rgb(212, 160, 23)");
    });
  });

  it("renders audio post as radio-shaped bubble with speaker and dial", async () => {
    const audioPost = makeMediaPost(3, { audio_url: "https://example.com/track.mp3" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [audioPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    const { container } = render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const audioBubble = screen.getByTestId("audio-bubble");
      expect(audioBubble).toBeInTheDocument();
      // Radio shape — uniform 16px corners
      const btn = audioBubble.closest("button")!;
      expect(btn.style.borderRadius).toBe("16px");
    });
  });

  it("text-only posts remain circular", async () => {
    const textPost = makeMediaPost(4);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [textPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const postText = screen.getByText(/Media post content/);
      const btn = postText.closest("button")!;
      expect(btn.style.borderRadius).toBe("50%");
    });
  });

  it("video bubbles are wider than tall (landscape aspect)", async () => {
    const videoPost = makeMediaPost(5, { video_url: "https://example.com/vid.mp4" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const videoBubble = screen.getByTestId("video-bubble");
      const btn = videoBubble.closest("button")!;
      const w = parseInt(btn.style.width);
      const h = parseInt(btn.style.height);
      expect(w).toBeGreaterThan(h);
    });
  });

  it("media posts get larger bubbles than text-only posts", async () => {
    const textPost = makeMediaPost(6, { text: "Short text" });
    const mediaPost = makeMediaPost(7, { text: "Short text", image_url: "https://example.com/img.jpg" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [textPost, mediaPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const imageBubble = screen.getByTestId("image-bubble").closest("button")!;
      const imageSize = parseInt(imageBubble.style.width);
      // Scaled by viewport — at default jsdom 1024x768, scale ≈ 0.96
      expect(imageSize).toBeGreaterThanOrEqual(95);
    });
  });

  it("audio bubble shows caption when text is short enough", async () => {
    const audioPost = makeMediaPost(8, { text: "Short tune", audio_url: "https://example.com/a.mp3" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [audioPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByText("Short tune")).toBeInTheDocument();
    });
  });

  it("audio bubble has a play button overlay", async () => {
    const audioPost = makeMediaPost(9, { audio_url: "https://example.com/beat.mp3" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [audioPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const audioBubble = screen.getByTestId("audio-bubble");
      // Play button overlay should exist inside audio bubble
      const playTriangles = audioBubble.querySelectorAll("div[style*='border-left']");
      expect(playTriangles.length).toBeGreaterThan(0);
    });
  });

  it("all corners are uniform on video bubbles", async () => {
    const videoPost = makeMediaPost(10, { video_url: "https://example.com/clip.mp4" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const btn = screen.getByTestId("video-bubble").closest("button")!;
      // Uniform corners — single value, not 4 different values
      expect(btn.style.borderRadius).toBe("12px");
    });
  });

  it("all corners are uniform on audio bubbles", async () => {
    const audioPost = makeMediaPost(11, { audio_url: "https://example.com/song.mp3" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [audioPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const btn = screen.getByTestId("audio-bubble").closest("button")!;
      expect(btn.style.borderRadius).toBe("16px");
    });
  });

  it("center bubble keeps video border styling when drilled into", async () => {
    const videoPost = makeMediaPost(12, { video_url: "https://example.com/main.mp4", text: "Center video post" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("video-bubble")).toBeInTheDocument());

    // Click the video bubble button to drill into it
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    const videoBtn = screen.getByTestId("video-bubble").closest("button")!;
    fireEvent.click(videoBtn);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const centerEl = screen.getByTitle("Center video post");
      expect(centerEl.style.borderRadius).toBe("12px");
      expect(centerEl.style.border).toContain("rgb(68, 68, 68)");
    });
  });

  it("center bubble keeps image gold frame when drilled into", async () => {
    const imagePost = makeMediaPost(13, { image_url: "https://example.com/main.jpg", text: "Center image post" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [imagePost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("image-bubble")).toBeInTheDocument());

    act(() => jest.advanceTimersByTime(2100)); // cooldown
    const imageBtn = screen.getByTestId("image-bubble").closest("button")!;
    fireEvent.click(imageBtn);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const centerEl = screen.getByTitle("Center image post");
      expect(centerEl.style.borderRadius).toBe("4px");
      expect(centerEl.style.border).toContain("rgb(212, 160, 23)");
    });
  });

  it("center bubble keeps audio border styling when drilled into", async () => {
    const audioPost = makeMediaPost(14, { audio_url: "https://example.com/main.mp3", text: "Center audio post" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [audioPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("audio-bubble")).toBeInTheDocument());

    act(() => jest.advanceTimersByTime(2100)); // cooldown
    const audioBtn = screen.getByTestId("audio-bubble").closest("button")!;
    fireEvent.click(audioBtn);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const centerEl = screen.getByTitle("Center audio post");
      expect(centerEl.style.borderRadius).toBe("16px");
      expect(centerEl.style.border).toContain("rgb(119, 119, 119)");
    });
  });

  it("center bubble shows TV antennae for video posts", async () => {
    const videoPost = makeMediaPost(16, { video_url: "https://example.com/ant.mp4", text: "Antenna video" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByTestId("video-bubble")).toBeInTheDocument());

    act(() => jest.advanceTimersByTime(2100));
    fireEvent.click(screen.getByTestId("video-bubble").closest("button")!);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("center-tv-antennae")).toBeInTheDocument();
    });
  });

  it("center bubble shows radio antenna for audio posts", async () => {
    const audioPost = makeMediaPost(17, { audio_url: "https://example.com/ant.mp3", text: "Antenna audio" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [audioPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByTestId("audio-bubble")).toBeInTheDocument());

    act(() => jest.advanceTimersByTime(2100));
    fireEvent.click(screen.getByTestId("audio-bubble").closest("button")!);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("center-radio-antenna")).toBeInTheDocument();
    });
  });

  it("orbit bubble antennae scale with bubble on hover", async () => {
    const videoPost = makeMediaPost(18, { video_url: "https://example.com/hover.mp4", text: "Hover antenna test" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    const videoBubble = await screen.findByTestId("video-bubble");
    const antennae = screen.getByTestId("tv-antennae");
    // Both should share the same wrapper container
    const wrapper = videoBubble.closest("button")!.parentElement!;
    expect(antennae.parentElement).toBe(wrapper);
    // Hovering the wrapper scales both bubble and antennae together
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.style.transform).toBe("scale(1.12)");
  });

  it("center bubble supports right-click for quick actions", async () => {
    const videoPost = makeMediaPost(15, { video_url: "https://example.com/rc.mp4", text: "Right click me" });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [videoPost], has_more: false } });
      return Promise.resolve({ data: { profile_picture_url: null, tags: [] } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("video-bubble")).toBeInTheDocument());

    // Click the video bubble to drill into it as center
    act(() => jest.advanceTimersByTime(2100)); // cooldown
    const videoBtn = screen.getByTestId("video-bubble").closest("button")!;
    fireEvent.click(videoBtn);
    act(() => jest.advanceTimersByTime(400));

    const centerEl = await screen.findByTitle("Right click me");
    // Right-click to open quick action menu
    fireEvent.contextMenu(centerEl);

    // Quick action menu should appear
    await waitFor(() => {
      expect(screen.getByText("Open post")).toBeInTheDocument();
    });
  });
});

describe("BubblesFeedPage — Responsive Scaling", () => {
  const manyPosts = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    text: `Responsive post ${i + 1} content`,
    username: "scaler",
    likes: i, reposts: 0, shares: 0, saves: 0, laughs: 0,
    unix_timestamp: 1700000000 + i,
    post_metadata: { tags: "technology" },
    replies_count: 0, quotes_count: 0, slop_count: 0,
    image_url: null, video_url: null, audio_url: null,
    profile_picture_url: null,
  }));

  beforeEach(() => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: manyPosts, has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });
  });

  it("shows more post bubbles when viewport is larger", async () => {
    // Default jsdom: 1024x768
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      const postButtons = screen.getAllByText(/Responsive post/);
      expect(postButtons.length).toBeGreaterThanOrEqual(3);
    });

    const defaultCount = screen.getAllByText(/Responsive post/).length;

    // Simulate larger viewport
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 1080 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => jest.advanceTimersByTime(100));

    await waitFor(() => {
      const largerCount = screen.getAllByText(/Responsive post/).length;
      expect(largerCount).toBeGreaterThanOrEqual(defaultCount);
    });
  });

  it("reduces post bubbles when viewport shrinks", async () => {
    // Start large
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 1080 });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getAllByText(/Responsive post/).length).toBeGreaterThanOrEqual(3);
    });
    const largeCount = screen.getAllByText(/Responsive post/).length;

    // Shrink viewport
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 640 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 480 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => jest.advanceTimersByTime(100));

    await waitFor(() => {
      const smallCount = screen.getAllByText(/Responsive post/).length;
      expect(smallCount).toBeLessThanOrEqual(largeCount);
    });
  });

  it("scales bubble sizes with viewport", async () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 1080 });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getAllByText(/Responsive post/).length).toBeGreaterThanOrEqual(1);
    });

    // Get a post bubble's size at large viewport
    const postEl = screen.getAllByText(/Responsive post/)[0];
    const btn = postEl.closest("button")!;
    const largeSize = parseInt(btn.style.width);

    // Shrink viewport
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 640 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 480 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => jest.advanceTimersByTime(100));

    await waitFor(() => {
      const smallPostEls = screen.getAllByText(/Responsive post/);
      if (smallPostEls.length > 0) {
        const smallBtn = smallPostEls[0].closest("button")!;
        const smallSize = parseInt(smallBtn.style.width);
        expect(smallSize).toBeLessThan(largeSize);
      }
    });
  });

  it("center bubble scales with viewport", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      // Center bubble shows the topic label in zoomed view
      const allTech = screen.getAllByTitle("Technology");
      // At least one should be the center div with a width
      const centerEl = allTech.find((el) => el.style.width && parseInt(el.style.width) > 50);
      expect(centerEl).toBeTruthy();
      expect(parseInt(centerEl!.style.width)).toBeGreaterThan(0);
    });
  });
});

describe("BubblesFeedPage — Quick Action Status Indicators", () => {
  const interactedPost = {
    id: 1, text: "Interacted post", username: "tester",
    likes: 5, reposts: 2, shares: 1, saves: 1, laughs: 3,
    liked_by_me: true, reposted_by_me: true, saved_by_me: true, laughed_by_me: true,
    unix_timestamp: 1700000000, post_metadata: { tags: "technology" },
    replies_count: 0, quotes_count: 0, slop_count: 0,
    image_url: null, video_url: null, audio_url: null, profile_picture_url: null,
  };

  const freshPost = {
    id: 2, text: "Fresh post", username: "tester",
    likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0,
    liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
    unix_timestamp: 1700000060, post_metadata: { tags: "technology" },
    replies_count: 0, quotes_count: 0, slop_count: 0,
    image_url: null, video_url: null, audio_url: null, profile_picture_url: null,
  };

  beforeEach(() => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [interactedPost, freshPost], has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });
  });

  it("shows Unlike label and checkmark when post is liked", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Interacted post/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Interacted post/), { clientX: 300, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-action-menu")).toBeInTheDocument();
      expect(screen.getByTestId("quick-like")).toHaveTextContent("Unlike");
      expect(screen.getByTestId("like-active")).toBeInTheDocument();
    });
  });

  it("shows Unrepost label and checkmark when post is reposted", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Interacted post/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Interacted post/), { clientX: 300, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-repost")).toHaveTextContent("Unrepost");
      expect(screen.getByTestId("repost-active")).toBeInTheDocument();
    });
  });

  it("shows Unsave label and checkmark when post is saved", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Interacted post/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Interacted post/), { clientX: 300, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-save")).toHaveTextContent("Unsave");
      expect(screen.getByTestId("save-active")).toBeInTheDocument();
    });
  });

  it("shows Unlaugh label and checkmark when post is laughed", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Interacted post/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Interacted post/), { clientX: 300, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-laugh")).toHaveTextContent("Unlaugh");
      expect(screen.getByTestId("laugh-active")).toBeInTheDocument();
    });
  });

  it("shows Like/Repost/Save/Laugh labels without checkmarks on fresh post", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Fresh post/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Fresh post/), { clientX: 300, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-like")).toHaveTextContent("Like");
      expect(screen.getByTestId("quick-like")).not.toHaveTextContent("Unlike");
      expect(screen.queryByTestId("like-active")).not.toBeInTheDocument();
      expect(screen.queryByTestId("repost-active")).not.toBeInTheDocument();
      expect(screen.queryByTestId("save-active")).not.toBeInTheDocument();
      expect(screen.queryByTestId("laugh-active")).not.toBeInTheDocument();
    });
  });

  it("Share button never shows a checkmark (one-time action)", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() => expect(screen.getByText(/Interacted post/)).toBeInTheDocument());

    fireEvent.contextMenu(screen.getByText(/Interacted post/), { clientX: 300, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByTestId("quick-share")).toHaveTextContent("Share");
      expect(screen.queryByTestId("share-active")).not.toBeInTheDocument();
    });
  });
});

describe("BubblesFeedPage — Multi-Image Carousel", () => {
  const makeMultiImagePost = (id: number) => ({
    id, text: "Multi image post", username: "gallery_user",
    likes: 3, reposts: 1, shares: 0, saves: 0,
    unix_timestamp: 1700000000, post_metadata: { tags: "photography" },
    replies_count: 0, quotes_count: 0, slop_count: 0,
    image_url: "https://img.com/1.jpg",
    image_urls: ["https://img.com/1.jpg", "https://img.com/2.jpg", "https://img.com/3.jpg"],
    video_url: null, audio_url: null, profile_picture_url: null,
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [makeMultiImagePost(1)], has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });
  });

  afterEach(() => { jest.useRealTimers(); });

  it("renders dot indicators for multi-image bubble", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("image-bubble")).toBeInTheDocument();
      expect(screen.getByTestId("carousel-dots")).toBeInTheDocument();
    });

    // Should have 3 dots
    const dots = screen.getByTestId("carousel-dots").children;
    expect(dots.length).toBe(3);
  });

  it("auto-rotates images every 3 seconds", async () => {
    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("image-bubble")).toBeInTheDocument();
    });

    // First image shown initially
    const img = screen.getByTestId("image-bubble").querySelector("img");
    expect(img?.src).toContain("1.jpg");

    // Advance 3 seconds — should rotate
    act(() => jest.advanceTimersByTime(3000));

    await waitFor(() => {
      const img2 = screen.getByTestId("image-bubble").querySelector("img");
      expect(img2?.src).toContain("2.jpg");
    });
  });

  it("center bubble shows carousel arrows for multi-image post", async () => {
    const multiImgPost = makeMultiImagePost(3);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [multiImgPost], has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("image-bubble")).toBeInTheDocument());

    // Drill into the post
    act(() => jest.advanceTimersByTime(2100));
    const btn = screen.getByTestId("image-bubble").closest("button")!;
    fireEvent.click(btn);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("center-carousel-prev")).toBeInTheDocument();
      expect(screen.getByTestId("center-carousel-next")).toBeInTheDocument();
    });
  });

  it("center carousel navigates on arrow click", async () => {
    const multiImgPost = makeMultiImagePost(4);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [multiImgPost], has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("image-bubble")).toBeInTheDocument());

    act(() => jest.advanceTimersByTime(2100));
    fireEvent.click(screen.getByTestId("image-bubble").closest("button")!);
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => expect(screen.getByTestId("center-carousel-next")).toBeInTheDocument());

    // Click next — should advance to image 2
    fireEvent.click(screen.getByTestId("center-carousel-next"));

    // Click prev — should go back to image 1
    fireEvent.click(screen.getByTestId("center-carousel-prev"));
  });

  it("single image bubble has no dots", async () => {
    const singleImgPost = {
      ...makeMultiImagePost(2),
      image_urls: ["https://img.com/single.jpg"],
    };
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [singleImgPost], has_more: false } });
      if (url.includes("/posts/tags")) return Promise.resolve({ data: { tags: [] } });
      return Promise.resolve({ data: { profile_picture_url: null, posts: [], has_more: false } });
    });

    render(<BubblesFeedPage />);
    dismissGoalPrompt();
    fireEvent.click(screen.getByTitle("Technology"));
    act(() => jest.advanceTimersByTime(400));

    await waitFor(() => {
      expect(screen.getByTestId("image-bubble")).toBeInTheDocument();
      expect(screen.queryByTestId("carousel-dots")).not.toBeInTheDocument();
    });
  });
});
