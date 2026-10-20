/**
 * Tests for /search page
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

let mockQuery: string | null = "test";
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => key === "q" ? mockQuery : null,
  }),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import SearchPage from "@/app/search/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockQuery = "test";
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const makePost = (id: number, text: string) => ({
  id, text, username: "user1", profile_picture_url: null,
  image_url: null, video_url: null, audio_url: null, post_metadata: {},
  liked_by_me: false, reposted_by_me: false, is_followed_by_me: false,
  is_me: false, likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 0,
  replies_count: 3, quotes_count: 0, slop_count: 0, saved_by_me: false,
  unix_timestamp: 1700000000, parent_post_id: null, quoted_post: null,
});

describe("SearchPage", () => {
  it("renders search input with query param", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    render(<SearchPage />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText("Search posts and users...");
      expect(input).toHaveValue("test");
    });
  });

  it("shows results heading with query", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText(/Results for/)).toBeInTheDocument();
    });
  });

  it("shows posts and users tabs", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Posts/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Users/ })).toBeInTheDocument();
    });
  });

  it("displays post search results", async () => {
    const posts = [makePost(1, "Test post about coding"), makePost(2, "Another test result")];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts, has_more: false } });
      return Promise.resolve({ data: { users: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("Test post about coding")).toBeInTheDocument();
      expect(screen.getByText("Another test result")).toBeInTheDocument();
    });
  });

  it("displays user search results", async () => {
    const users = [
      { username: "testuser1", bio: "A test user", profile_picture_url: null },
      { username: "testuser2", bio: null, profile_picture_url: null },
    ];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/users")) return Promise.resolve({ data: { users, has_more: false } });
      return Promise.resolve({ data: { posts: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Users/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Users/ }));

    await waitFor(() => {
      expect(screen.getByText("@testuser1")).toBeInTheDocument();
      expect(screen.getByText("A test user")).toBeInTheDocument();
      expect(screen.getByText("@testuser2")).toBeInTheDocument();
    });
  });

  it("shows no posts found message", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("No posts found.")).toBeInTheDocument();
    });
  });

  it("shows no users found message", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    render(<SearchPage />);

    fireEvent.click(screen.getByRole("button", { name: /Users/ }));

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("post results link to post detail page", async () => {
    const posts = [makePost(42, "Linked post")];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts, has_more: false } });
      return Promise.resolve({ data: { users: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      const link = screen.getByText("Linked post").closest("a");
      expect(link).toHaveAttribute("href", "/post/42");
    });
  });

  it("user results link to profile page", async () => {
    const users = [{ username: "linkeduser", bio: null, profile_picture_url: null }];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/users")) return Promise.resolve({ data: { users, has_more: false } });
      return Promise.resolve({ data: { posts: [], has_more: false } });
    });

    render(<SearchPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Users/ }));

    await waitFor(() => {
      const link = screen.getByText("@linkeduser").closest("a");
      expect(link).toHaveAttribute("href", "/profile/linkeduser");
    });
  });

  it("shows load more button when has_more is true", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts: [makePost(1, "Result")], has_more: true } });
      return Promise.resolve({ data: { users: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByAltText("Load more")).toBeInTheDocument();
    });
  });

  it("does not search on empty query", async () => {
    mockQuery = "";
    render(<SearchPage />);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("has back to feed link", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    render(<SearchPage />);

    const backLink = screen.getByText(/Back to feed/);
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("shows engagement stats on post results via PostCard interactions", async () => {
    const posts = [makePost(1, "Engaged post")];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts, has_more: false } });
      return Promise.resolve({ data: { users: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("Engaged post")).toBeInTheDocument();
      // PostCard shows interactions when "Show interactions" is clicked
      expect(screen.getByText("Show interactions")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Show interactions"));
    // PostActions now visible with counts
    expect(screen.getByTitle("Like")).toBeInTheDocument();
  });

  it("switching tabs shows correct content", async () => {
    const posts = [makePost(1, "Post result")];
    const users = [{ username: "user_result", bio: "A user", profile_picture_url: null }];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts, has_more: false } });
      if (url.includes("/search/users")) return Promise.resolve({ data: { users, has_more: false } });
      return Promise.resolve({ data: {} });
    });

    render(<SearchPage />);

    // Posts tab active by default
    await waitFor(() => {
      expect(screen.getByText("Post result")).toBeInTheDocument();
    });

    // Switch to Users
    fireEvent.click(screen.getByRole("button", { name: /Users/ }));
    await waitFor(() => {
      expect(screen.getByText("@user_result")).toBeInTheDocument();
    });

    // Switch back to Posts
    fireEvent.click(screen.getByRole("button", { name: /Posts/ }));
    await waitFor(() => {
      expect(screen.getByText("Post result")).toBeInTheDocument();
    });
  });

  it("clicking load more for posts appends results", async () => {
    const page1 = [makePost(1, "First result")];
    const page2 = [makePost(2, "Second result")];
    let callCount = 0;
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) {
        callCount++;
        if (callCount <= 1) return Promise.resolve({ data: { posts: page1, has_more: true } });
        return Promise.resolve({ data: { posts: page2, has_more: false } });
      }
      return Promise.resolve({ data: { users: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("First result")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByAltText("Load more"));

    await waitFor(() => {
      expect(screen.getByText("First result")).toBeInTheDocument();
      expect(screen.getByText("Second result")).toBeInTheDocument();
    });
  });

  it("switches to users tab and displays user results", async () => {
    const userResults = [{ username: "user1", bio: "Bio", profile_picture_url: null }];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/users")) {
        return Promise.resolve({ data: { users: userResults, has_more: false } });
      }
      return Promise.resolve({ data: { posts: [], has_more: false } });
    });

    await act(async () => { render(<SearchPage />); });

    // Wait for initial posts tab to load, then switch to Users
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Users/ }));
    });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/search/users"),
        expect.any(Object)
      );
    });
  });

  it("handles search API error gracefully", async () => {
    mockedApi.get.mockRejectedValue(new Error("Network error"));
    render(<SearchPage />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("shows searching indicator", async () => {
    mockedApi.get.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<SearchPage />);

    expect(screen.getByText("Searching...")).toBeInTheDocument();
  });

  it("user bio truncation works for long bios", async () => {
    const users = [{ username: "longbio", bio: "B".repeat(200), profile_picture_url: null }];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/users")) return Promise.resolve({ data: { users, has_more: false } });
      return Promise.resolve({ data: { posts: [], has_more: false } });
    });

    render(<SearchPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Users/ }));

    await waitFor(() => {
      const bioText = screen.getByText(/B{10,}/);
      expect(bioText.textContent!.length).toBeLessThanOrEqual(101);
    });
  });

  it("renders long post text in PostCard", async () => {
    const longText = "A".repeat(300);
    const posts = [makePost(1, longText)];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/search/posts")) return Promise.resolve({ data: { posts, has_more: false } });
      return Promise.resolve({ data: { users: [], has_more: false } });
    });

    render(<SearchPage />);

    await waitFor(() => {
      // PostCard renders the full text
      const textEl = screen.getByText(/A{10,}/);
      expect(textEl).toBeInTheDocument();
    });
  });
});
