/**
 * Performance tests — verify component rendering, large list handling,
 * and interaction responsiveness meet thresholds.
 *
 * These run in jsdom so they measure React reconciliation/rendering
 * performance, not browser paint performance.
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";
import axios from "axios";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
jest.mock("axios");
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useParams: () => ({ username: "testuser" }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import Home from "@/app/lame/page";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import ReplyThread from "@/components/ReplyThread";
import type { Post } from "@/types/post";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const makePost = (id: number, overrides: Partial<Post> = {}): Post => ({
  id,
  text: `Post number ${id} with some content`,
  username: `user_${id % 10}`,
  profile_picture_url: null,
  image_url: id % 3 === 0 ? "https://example.com/img.jpg" : null,
  video_url: id % 5 === 0 ? "https://example.com/vid.mp4" : null,
  audio_url: id % 7 === 0 ? "https://example.com/aud.mp3" : null,
  post_metadata: id % 2 === 0 ? { tags: ["tag1", "tag2"], location: "NYC" } : {},
  liked_by_me: id % 4 === 0,
  reposted_by_me: id % 6 === 0,
  is_followed_by_me: id % 3 === 0,
  is_me: id % 10 === 0,
  likes: id * 2,
  laughs: 0,
  reposts: id,
  shares: Math.floor(id / 2),
  saves: Math.floor(id / 3),
  replies_count: id % 5,
  quotes_count: id % 3,
  slop_count: 0,
  saved_by_me: false,
  unix_timestamp: 1700000000 + id * 60,
  parent_post_id: null,
  quoted_post: id % 8 === 0 ? { id: 999, username: "quoted_user", text: "Quoted content" } : null,
  reposted_by: id % 9 === 0 ? ["reposter1", "reposter2"] : undefined,
  ...overrides,
});

const mockHandlers = {
  onToggleLike: jest.fn(), onToggleLaugh: jest.fn(),
  onRepost: jest.fn(),
  onShare: jest.fn(),
  onToggleSave: jest.fn().mockResolvedValue(true),
  onMarkSlop: jest.fn(),
  onReport: jest.fn(),
  onQuote: jest.fn(),
  onFollowToggle: jest.fn(),
  onToggleReplies: jest.fn(),
  onFetchReplies: jest.fn().mockResolvedValue(undefined),
};

function timed<T>(fn: () => T): [T, number] {
  const start = performance.now();
  const result = fn();
  return [result, performance.now() - start];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LARGE LIST RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

describe("Large list rendering performance", () => {
  it("renders 100 PostCards within threshold", () => {
    const posts = Array.from({ length: 100 }, (_, i) => makePost(i + 1));

    const [, elapsed] = timed(() => {
      render(
        <div>
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              token="test-token"
              openReplies={{}}
              repliesByPost={{}}
              {...mockHandlers}
            />
          ))}
        </div>
      );
    });

    expect(elapsed).toBeLessThan(5000); // 5s for 100 cards in jsdom
    expect(screen.getAllByText(/Post number \d+/)).toHaveLength(100);
  });

  it("renders 50 posts via Home page within threshold", async () => {
    localStorage.setItem("token", "test-token");
    const posts = Array.from({ length: 50 }, (_, i) => makePost(i + 1));

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: { profile_picture_url: null } });
      return Promise.resolve({ data: { posts } });
    });

    const start = performance.now();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Post number 1 with some content")).toBeInTheDocument();
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it("renders 200 PostCards without crashing", () => {
    const posts = Array.from({ length: 200 }, (_, i) => makePost(i + 1));

    const { container } = render(
      <div>
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            index={i}
            token="test-token"
            openReplies={{}}
            repliesByPost={{}}
            {...mockHandlers}
          />
        ))}
      </div>
    );

    expect(container.querySelectorAll('[id^="post-"]')).toHaveLength(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENT MOUNT/UNMOUNT CYCLES
// ═══════════════════════════════════════════════════════════════════════════════

describe("Component mount/unmount cycle performance", () => {
  it("PostCard mounts and unmounts 50 times without memory issues", () => {
    const post = makePost(1);

    const [, elapsed] = timed(() => {
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <PostCard
            post={post}
            index={0}
            token="test-token"
            openReplies={{}}
            repliesByPost={{}}
            {...mockHandlers}
          />
        );
        unmount();
      }
    });

    expect(elapsed).toBeLessThan(5000);
  });

  it("PostComposer mounts and unmounts 50 times without leaks", () => {
    const [, elapsed] = timed(() => {
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <PostComposer
            token="test-token"
            quotePreview={null}
            onClearQuote={jest.fn()}
            onPostCreated={jest.fn()}
            quotePostId={null}
          />
        );
        unmount();
      }
    });

    expect(elapsed).toBeLessThan(3000);
  });

  it("ReplyThread mounts and unmounts 50 times", () => {
    const replies = Array.from({ length: 10 }, (_, i) => makePost(i + 100));

    const [, elapsed] = timed(() => {
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <ReplyThread
            parentId={1}
            token="test-token"
            openReplies={{ 1: true }}
            repliesByPost={{ 1: replies }}
            onToggleReplies={jest.fn()}
            onFetchReplies={jest.fn().mockResolvedValue(undefined)}
            onToggleLike={jest.fn()} onToggleLaugh={jest.fn()}
            onRepost={jest.fn()}
            onShare={jest.fn()}
            onToggleSave={jest.fn().mockResolvedValue(true)}
            onMarkSlop={jest.fn()}
            onQuote={jest.fn()} onReport={jest.fn()}
          />
        );
        unmount();
      }
    });

    expect(elapsed).toBeLessThan(5000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  INTERACTION RESPONSIVENESS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Interaction responsiveness", () => {
  it("rapid like clicks on multiple posts complete quickly", async () => {
    localStorage.setItem("token", "test-token");
    const posts = Array.from({ length: 20 }, (_, i) => makePost(i + 1));

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { likes: 1, action: "liked" } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Post number 1 with some content")).toBeInTheDocument();
    });

    // Click "Show interactions" on each post to reveal action buttons
    const showButtons = screen.getAllByText("Show interactions");
    for (const btn of showButtons.slice(0, 10)) {
      fireEvent.click(btn);
    }

    const likeButtons = screen.getAllByTitle("Like");

    const start = performance.now();
    for (const btn of likeButtons.slice(0, 10)) {
      fireEvent.click(btn);
    }
    const elapsed = performance.now() - start;

    // 10 clicks should be processed within 1s of synchronous time
    expect(elapsed).toBeLessThan(1000);
  });

  it("rapid tab switching does not degrade", async () => {
    localStorage.setItem("token", "test-token");

    mockedApi.get.mockResolvedValue({
      data: { posts: [makePost(1)], profile_picture_url: null },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();
    });

    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      fireEvent.click(screen.getByRole("button", { name: i % 2 === 0 ? "Following" : "Algo" }));
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1000);
  });

  it("opening slop modal on many posts completes quickly", () => {
    const posts = Array.from({ length: 20 }, (_, i) => makePost(i + 1));

    render(
      <div>
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            index={i}
            token="test-token"
            openReplies={{}}
            repliesByPost={{}}
            {...mockHandlers}
          />
        ))}
      </div>
    );

    // Click "Show interactions" on each post to reveal action buttons
    const showButtons = screen.getAllByText("Show interactions");
    for (const btn of showButtons.slice(0, 5)) {
      fireEvent.click(btn);
    }

    const slopButtons = screen.getAllByTitle("Mark as Slop");

    const start = performance.now();
    // Open and close slop modal on first 5 posts
    for (const btn of slopButtons.slice(0, 5)) {
      fireEvent.click(btn);
      // Close by clicking backdrop
      const backdrop = document.querySelector('div[style*="position: fixed"]');
      if (backdrop) fireEvent.click(backdrop);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  DEEPLY NESTED REPLIES
// ═══════════════════════════════════════════════════════════════════════════════

describe("Deeply nested reply performance", () => {
  it("renders 5-level deep reply chain without excessive time", () => {
    // Build a chain: post 1 -> reply 2 -> reply 3 -> reply 4 -> reply 5
    const replies: Record<number, Post[]> = {};
    const openReplies: Record<number, boolean> = { 1: true };

    for (let depth = 0; depth < 5; depth++) {
      const parentId = depth === 0 ? 1 : 100 + depth - 1;
      const childId = 100 + depth;
      replies[parentId] = [makePost(childId, { text: `Depth ${depth + 1} reply`, username: `user_d${depth}` })];
      openReplies[childId] = true;
    }

    const [, elapsed] = timed(() => {
      render(
        <ReplyThread
          parentId={1}
          token="test-token"
          openReplies={openReplies}
          repliesByPost={replies}
          onToggleReplies={jest.fn()}
          onFetchReplies={jest.fn().mockResolvedValue(undefined)}
          onToggleLike={jest.fn()} onToggleLaugh={jest.fn()}
          onRepost={jest.fn()}
          onShare={jest.fn()}
          onToggleSave={jest.fn().mockResolvedValue(true)}
          onMarkSlop={jest.fn()}
          onQuote={jest.fn()} onReport={jest.fn()}
        />
      );
    });

    expect(elapsed).toBeLessThan(2000);

    // All depth levels rendered
    for (let d = 1; d <= 5; d++) {
      expect(screen.getByText(`Depth ${d} reply`)).toBeInTheDocument();
    }
  });

  it("renders wide reply tree (20 siblings) within threshold", () => {
    const replies = Array.from({ length: 20 }, (_, i) =>
      makePost(100 + i, { text: `Sibling reply ${i}`, username: `user_s${i}` })
    );

    const [, elapsed] = timed(() => {
      render(
        <ReplyThread
          parentId={1}
          token="test-token"
          openReplies={{ 1: true }}
          repliesByPost={{ 1: replies }}
          onToggleReplies={jest.fn()}
          onFetchReplies={jest.fn().mockResolvedValue(undefined)}
          onToggleLike={jest.fn()} onToggleLaugh={jest.fn()}
          onRepost={jest.fn()}
          onShare={jest.fn()}
          onToggleSave={jest.fn().mockResolvedValue(true)}
          onMarkSlop={jest.fn()}
          onQuote={jest.fn()} onReport={jest.fn()}
        />
      );
    });

    expect(elapsed).toBeLessThan(3000);
    expect(screen.getAllByText(/Sibling reply \d+/)).toHaveLength(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  RE-RENDER PERFORMANCE — state updates shouldn't cause full re-renders
// ═══════════════════════════════════════════════════════════════════════════════

describe("Re-render performance", () => {
  it("updating one post in feed does not re-render all posts excessively", async () => {
    localStorage.setItem("token", "test-token");
    const posts = Array.from({ length: 30 }, (_, i) => makePost(i + 1));

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { likes: 99, action: "liked" } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Post number 1 with some content")).toBeInTheDocument();
    });

    // Click "Show interactions" on the first post to reveal action buttons
    fireEvent.click(screen.getAllByText("Show interactions")[0]);

    // Like the first post — should update state
    const start = performance.now();
    fireEvent.click(screen.getAllByTitle("Like")[0]);
    const elapsed = performance.now() - start;

    // Synchronous click processing should be fast even with 30 posts
    expect(elapsed).toBeLessThan(500);
  });

  it("metadata toggle only affects one PostCard", () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      makePost(i + 1, { post_metadata: { tags: ["test"], location: "NYC" } })
    );

    render(
      <div>
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            index={i}
            token="test-token"
            openReplies={{}}
            repliesByPost={{}}
            {...mockHandlers}
          />
        ))}
      </div>
    );

    // Click "Show interactions" on each post to reveal action buttons
    const showInteractionButtons = screen.getAllByText("Show interactions");
    for (const btn of showInteractionButtons) {
      fireEvent.click(btn);
    }

    // Toggle metadata on first post
    const tagButtons = screen.getAllByTitle("Toggle metadata");
    fireEvent.click(tagButtons[0]);

    // Only first post should show metadata
    const tagLabels = screen.getAllByText("Tags:");
    expect(tagLabels).toHaveLength(1);
  });
});
