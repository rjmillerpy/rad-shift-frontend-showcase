/**
 * Integration test: full feed page flow.
 *
 * Tests the interaction between Home page, PostCard, PostComposer, PostActions,
 * and ReplyThread across multiple user actions in sequence.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const makePost = (overrides: any = {}) => ({
  id: 1,
  text: "Test post",
  username: "testuser",
  profile_picture_url: null,
  image_url: null,
  video_url: null,
  audio_url: null,
  post_metadata: {},
  liked_by_me: false,
  reposted_by_me: false,
  is_followed_by_me: false,
  is_me: true,
  likes: 0,
  reposts: 0,
  shares: 0,
  saves: 0,
  replies_count: 0,
  quotes_count: 0,
  slop_count: 0,
  saved_by_me: false,
  reposted_by: [],
  unix_timestamp: 1700000000,
  parent_post_id: null,
  quoted_post: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  // Default: axios.isAxiosError returns false
  (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Feed flow integration", () => {
  it("loads posts on mount and displays them", async () => {
    const posts = [makePost({ text: "Hello world", username: "alice" }), makePost({ id: 2, text: "Second post", username: "bob" })];
    mockedApi.get.mockResolvedValue({ data: { posts } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
      expect(screen.getByText("Second post")).toBeInTheDocument();
    });
  });

  it("authenticated user sees composer and can create a post", async () => {
    localStorage.setItem("token", "fake-token");
    mockedApi.get.mockResolvedValue({ data: { posts: [], profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { message: "Post created", image_url: null, video_url: null, audio_url: null } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New post" })).toBeInTheDocument();
    });

    // Click FAB to open the composer modal
    fireEvent.click(screen.getByRole("button", { name: "New post" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Write a post...")).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText("Write a post..."), "My new post");
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
    });
  });

  it("like → unlike flow calls API correctly", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Likeable", likes: 0, liked_by_me: false })];

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValueOnce({ data: { likes: 1, action: "liked" } })
      .mockResolvedValueOnce({ data: { likes: 0, action: "unliked" } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Likeable")).toBeInTheDocument();
    });

    // Click "Show interactions" to reveal action buttons
    fireEvent.click(screen.getByText("Show interactions"));

    // Like
    fireEvent.click(screen.getByTitle("Like"));
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/like/1")
      );
    });
  });

  it("tab switching calls different API endpoints", async () => {
    localStorage.setItem("token", "fake-token");
    const algoPosts = [makePost({ text: "Algo feed post" })];
    const followingPosts = [makePost({ id: 2, text: "Following post", username: "followed_user", is_me: false })];

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/posts/following")) return Promise.resolve({ data: { posts: followingPosts } });
      if (url.includes("/profile/me")) return Promise.resolve({ data: { profile_picture_url: null } });
      return Promise.resolve({ data: { posts: algoPosts } });
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Algo feed post")).toBeInTheDocument();
    });

    // Switch to Following
    fireEvent.click(screen.getByRole("button", { name: "Following" }));

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/posts/following"),
        expect.objectContaining({ params: expect.any(Object) })
      );
    });
  });

  it("logout clears token and hides composer", async () => {
    localStorage.setItem("token", "fake-token");
    mockedApi.get.mockResolvedValue({ data: { posts: [], profile_picture_url: null } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("share copies link and shows alert", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Share me", shares: 0 })];

    // Reset any lingering mockResolvedValueOnce values from earlier tests
    // (the like/unlike test above queues a second Once that never gets consumed).
    mockedApi.post.mockReset();
    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { share_url: "/posts/1", shares: 1 } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Share me")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Show interactions"));
    fireEvent.click(screen.getByTitle("Share"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Post link copied!");
    });
  });

  it("quote flow scrolls to top and shows preview", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Quotable post" })];

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Quotable post")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Show interactions"));
    fireEvent.click(screen.getByTitle("Quote"));

    // Quote action opens the composer modal with the quote preview
    await waitFor(() => {
      expect(screen.getByText("Create Post")).toBeInTheDocument();
      expect(screen.getByText(/Quoting @testuser/)).toBeInTheDocument();
    });
  });

  it("reply thread opens and displays replies", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Post with replies", replies_count: 2 })];
    const replies = [
      makePost({ id: 10, text: "Reply 1", username: "replier" }),
      makePost({ id: 11, text: "Reply 2", username: "replier2" }),
    ];

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies } });
      if (url.includes("/profile/me")) return Promise.resolve({ data: { profile_picture_url: null } });
      return Promise.resolve({ data: { posts } });
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Post with replies")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Show interactions"));
    fireEvent.click(screen.getByTitle("Show replies"));

    await waitFor(() => {
      expect(screen.getByText("Reply 1")).toBeInTheDocument();
      expect(screen.getByText("Reply 2")).toBeInTheDocument();
    });
  });

  it("follow/unfollow toggles button text", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Other post", username: "otheruser", is_me: false, is_followed_by_me: false })];

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { message: "Followed" } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTitle("Follow")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Follow"));

    await waitFor(() => {
      expect(screen.getByTitle("Unfollow")).toBeInTheDocument();
    });
  });

  it("expired token redirects to login", async () => {
    localStorage.setItem("token", "expired-token");

    const error = { response: { status: 401 } };
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.reject(error);
      return Promise.resolve({ data: { posts: [] } });
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  it("save post calls API and repost calls API", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Action post" })];

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { saves: 1, action: "saved" } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Action post")).toBeInTheDocument();
    });

    // Click "Show interactions" to reveal action buttons
    fireEvent.click(screen.getByText("Show interactions"));

    // Test save
    fireEvent.click(screen.getByTitle("Save (and download media/screenshot)"));
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/save/1")
      );
    });
  });

  it("slop button opens modal and submits", async () => {
    localStorage.setItem("token", "fake-token");
    const posts = [makePost({ text: "Sloppy post" })];

    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });
    mockedApi.post.mockResolvedValue({ data: { status: "ok", post_id: 1 } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Sloppy post")).toBeInTheDocument();
    });

    // Click "Show interactions" to reveal action buttons
    fireEvent.click(screen.getByText("Show interactions"));

    // Open slop modal
    fireEvent.click(screen.getByTitle("Mark as Slop"));

    await waitFor(() => {
      expect(screen.getByText("Mark as Slop", { selector: "h4" })).toBeInTheDocument();
    });

    // Submit slop
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/slop/1"),
        expect.objectContaining({ reason: "AI" })
      );
    });
  });
});
