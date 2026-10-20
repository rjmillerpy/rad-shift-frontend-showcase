/**
 * Tests for /post/[id] detail page
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "42" }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import PostDetailPage from "@/app/post/[id]/page";

const makePost = (overrides: any = {}) => ({
  id: 42,
  text: "Detailed post content",
  username: "alice",
  profile_picture_url: null,
  image_url: null,
  video_url: null,
  audio_url: null,
  post_metadata: { tags: ["test"], location: "NYC" },
  liked_by_me: false,
  reposted_by_me: false,
  is_followed_by_me: false,
  is_me: false,
  likes: 10,
  reposts: 3,
  shares: 5,
  saves: 2,
  replies_count: 2,
  quotes_count: 1,
  slop_count: 0,
  saved_by_me: false,
  is_saved_by_me: false,
  unix_timestamp: 1700000000,
  parent_post_id: null,
  quoted_post: null,
  reposted_by: [],
  ...overrides,
});

const makeReply = (id: number, text: string) => ({
  ...makePost({ id, text, username: "replier", replies_count: 0, quotes_count: 0 }),
});

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
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("PostDetailPage", () => {
  it("shows loading state initially", () => {
    mockedApi.get.mockReturnValue(new Promise(() => {}));
    render(<PostDetailPage />);
    expect(screen.getByText("Loading post...")).toBeInTheDocument();
  });

  it("shows post not found when API returns error", async () => {
    mockedApi.get.mockRejectedValue(new Error("404"));
    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Post not found.")).toBeInTheDocument();
      expect(screen.getByText("Back to feed")).toBeInTheDocument();
    });
  });

  it("renders post content with larger text", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Detailed post content")).toBeInTheDocument();
      expect(screen.getByText("alice")).toBeInTheDocument();
    });
  });

  it("shows back to feed link", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      const backLink = screen.getByText(/Back to feed/);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/");
    });
  });

  it("renders media elements", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({
        data: {
          post: makePost({
            image_url: "https://example.com/img.jpg",
            video_url: "https://example.com/vid.mp4",
            audio_url: "https://example.com/aud.mp3",
          }),
        },
      });
    });

    const { container } = render(<PostDetailPage />);

    await waitFor(() => {
      expect(container.querySelector("video")).toBeInTheDocument();
      expect(container.querySelector("audio")).toBeInTheDocument();
    });
  });

  it("renders quoted post with link to its detail page", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({
        data: {
          post: makePost({
            quoted_post: { id: 99, username: "bob", text: "Original post" },
          }),
        },
      });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Quoting @bob/)).toBeInTheDocument();
      expect(screen.getByText(/Original post/)).toBeInTheDocument();
      // Quoted post links to its detail page
      const quoteLink = screen.getByText(/Quoting @bob/).closest("a");
      expect(quoteLink).toHaveAttribute("href", "/post/99");
    });
  });

  it("auto-expands replies on load", async () => {
    const replies = [makeReply(100, "First reply"), makeReply(101, "Second reply")];
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/42/replies")) return Promise.resolve({ data: { replies } });
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("First reply")).toBeInTheDocument();
      expect(screen.getByText("Second reply")).toBeInTheDocument();
    });
  });

  it("shows replies count in header", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost({ replies_count: 5 }) } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Replies (5)")).toBeInTheDocument();
    });
  });

  it("shows interactions (PostActions) always visible without toggle", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      // PostActions should be visible without clicking "Show interactions"
      expect(screen.getByTitle("Like")).toBeInTheDocument();
      expect(screen.getByTitle("Repost")).toBeInTheDocument();
      expect(screen.getByTitle("Share")).toBeInTheDocument();
    });
  });

  it("shows metadata expanded by default", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Tags:")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
      expect(screen.getByText("NYC")).toBeInTheDocument();
    });
  });

  it("handles like interaction", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { likes: 11, action: "liked" } });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByTitle("Like")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Like"));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/like/42")
      );
    });
  });

  it("handles share interaction", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { share_url: "/posts/42", shares: 6 } });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByTitle("Share")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Share"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Post link copied!");
    });
  });

  it("handles follow toggle", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { message: "Followed" } });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByTitle("Follow")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Follow"));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/follow/alice"),
        {}
      );
    });
  });

  it("does not show follow button for own posts", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost({ is_me: true }) } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Detailed post content")).toBeInTheDocument();
    });

    expect(screen.queryByTitle("Follow")).not.toBeInTheDocument();
  });

  it("fetches post with auth token when available", async () => {
    localStorage.setItem("token", "my-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/posts/42")
      );
    });
  });

  it("fetches post without auth when no token", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/posts/42")
      );
    });
  });

  it("handles repost interaction", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { reposts: 4, action: "re-posted" } });

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Repost")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Repost"));
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/repost/42")
      );
    });
  });

  it("handles save interaction", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { saves: 3, action: "saved" } });

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Save (and download media/screenshot)")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Save (and download media/screenshot)"));
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/save/42")
      );
    });
  });

  it("handles mark slop interaction", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { status: "ok" } });

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Mark as Slop")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Mark as Slop"));
    await waitFor(() => expect(screen.getByText("Mark as Slop", { selector: "h4" })).toBeInTheDocument());
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/slop/42"),
        expect.objectContaining({ reason: "AI" })
      );
    });
  });

  it("handles report interaction", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockResolvedValue({ data: { status: "ok" } });

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Report")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Report"));
    await waitFor(() => expect(screen.getByText("Report Post")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Submit Report"));
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/slop/42"),
        expect.objectContaining({ reason: expect.stringContaining("[REPORT]") })
      );
    });
  });

  it("handles follow toggle error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockRejectedValue(new Error("Network error"));

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Follow")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Follow"));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Toggling follow failed:", expect.any(Error));
    });
  });

  it("handles like error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockRejectedValue(new Error("Network error"));

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Like")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Like"));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Like failed", expect.any(Error));
    });
  });

  it("handles repost error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockRejectedValue(new Error("Network error"));

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Repost")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Repost"));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Repost failed", expect.any(Error));
    });
  });

  it("handles share error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockRejectedValue(new Error("Network error"));

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Share")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Share"));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Share failed", expect.any(Error));
    });
  });

  it("handles save error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });
    mockedApi.post.mockRejectedValue(new Error("Network error"));

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Save (and download media/screenshot)")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Save (and download media/screenshot)"));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Save failed", expect.any(Error));
    });
  });

  it("handles slop without token gracefully", async () => {
    // No token
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);
    await waitFor(() => expect(screen.getByTitle("Mark as Slop")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Mark as Slop"));
    await waitFor(() => expect(screen.getByText("Submit")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Submit"));
    // Should not crash, just silently return
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("shows reposted_by info", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost({ reposted_by: ["bob", "charlie"] }) } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Reposted by bob, charlie/)).toBeInTheDocument();
    });
  });

  it("shows profile picture in corner when logged in", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: { profile_picture_url: "https://example.com/pic.jpg" } });
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      const profileImg = screen.getByAltText("Your profile");
      expect(profileImg).toBeInTheDocument();
    });
  });

  it("profile picture in corner navigates to profile on click", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: { profile_picture_url: null } });
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByAltText("Your profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByAltText("Your profile"));
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("shows 'Log in' link in corner when not logged in", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Detailed post content")).toBeInTheDocument();
    });

    const loginLink = screen.getByText("Log in");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("does not show profile picture when not logged in", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Detailed post content")).toBeInTheDocument();
    });

    expect(screen.queryByAltText("Your profile")).not.toBeInTheDocument();
  });

  it("profile picture uses polygon clip-path", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: { profile_picture_url: null } });
      if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
      return Promise.resolve({ data: { post: makePost() } });
    });

    render(<PostDetailPage />);

    await waitFor(() => {
      const img = screen.getByAltText("Your profile");
      expect(img.style.clipPath).toContain("polygon");
    });
  });
});
