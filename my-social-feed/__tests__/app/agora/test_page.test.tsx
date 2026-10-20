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

import AgoraPage from "@/app/agora/page";

const makePost = (id: number, text: string, overrides: any = {}) => ({
  id, text, username: `user${id}`, likes: id * 2, reposts: id, shares: 0, saves: 0, laughs: id,
  unix_timestamp: 1700000000 + id * 60, post_metadata: {}, profile_picture_url: null,
  image_url: null, video_url: null, audio_url: null,
  replies_count: id % 3, quotes_count: 0, slop_count: 0,
  liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
  ...overrides,
});

const samplePosts = [makePost(1, "First forum post"), makePost(2, "Second forum post"), makePost(3, "Third with image", { image_url: "https://img.com/pic.jpg" })];

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockedApi.get.mockResolvedValue({ data: { posts: samplePosts, has_more: true } });
});

describe("AgoraPage", () => {
  describe("Rendering", () => {
    it("renders forum header", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText("Agora")).toBeInTheDocument();
      });
    });

    it("renders forum table with posts", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("forum-table")).toBeInTheDocument();
        expect(screen.getByText(/First forum post/)).toBeInTheDocument();
        expect(screen.getByText(/Second forum post/)).toBeInTheDocument();
      });
    });

    it("shows post numbers", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("shows author usernames", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText("user1")).toBeInTheDocument();
        expect(screen.getByText("user2")).toBeInTheDocument();
      });
    });

    it("shows engagement stats", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText(/❤️ 2/)).toBeInTheDocument();
      });
    });

    it("shows media indicators", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText("[img]")).toBeInTheDocument();
      });
    });

    it("shows reply count", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        const replies = screen.getAllByText(/reply|replies/);
        expect(replies.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("shows empty state when no posts", async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText(/No posts yet/)).toBeInTheDocument();
      });
    });

    it("shows breadcrumb navigation", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText("Agora Forum")).toBeInTheDocument();
      });
    });

    it("shows login link when not authenticated", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText(/Log In/)).toBeInTheDocument();
      });
    });

    it("shows profile link when authenticated", async () => {
      localStorage.setItem("token", "test-token");
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText("My Profile")).toBeInTheDocument();
      });
    });
  });

  describe("Tabs", () => {
    it("renders all tab buttons", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("tab-algo")).toBeInTheDocument();
        expect(screen.getByTestId("tab-following")).toBeInTheDocument();
      });
    });

    it("switches to following tab", async () => {
      localStorage.setItem("token", "test-token");
      await act(async () => { render(<AgoraPage />); });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-following"));
      });

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/posts/following"),
        expect.any(Object)
      );
    });
  });

  describe("Post click navigates to thread", () => {
    it("navigates to /agora/{id} when post row is clicked", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => expect(screen.getByTestId("post-row-1")).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByTestId("post-row-1"));
      });

      expect(mockPush).toHaveBeenCalledWith("/agora/1");
    });

    it("truncates long post text in listing", async () => {
      const longPost = makePost(10, "A".repeat(200));
      mockedApi.get.mockResolvedValue({ data: { posts: [longPost], has_more: false } });

      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByText(/A{10,}…/)).toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    it("shows pagination bar", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("prev-page")).toBeInTheDocument();
        expect(screen.getByTestId("next-page")).toBeInTheDocument();
        expect(screen.getByText("Page 1")).toBeInTheDocument();
      });
    });

    it("disables prev on first page", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("prev-page")).toBeDisabled();
      });
    });

    it("enables next when has_more", async () => {
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("next-page")).not.toBeDisabled();
      });
    });

    it("disables next when no more", async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: samplePosts, has_more: false } });
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("next-page")).toBeDisabled();
      });
    });
  });

  describe("Media indicators in listing", () => {
    it("shows video indicator", async () => {
      const videoPost = makePost(22, "Has video", { video_url: "https://vid.com/v.mp4" });
      mockedApi.get.mockResolvedValue({ data: { posts: [videoPost], has_more: false } });
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => { expect(screen.getByText("[video]")).toBeInTheDocument(); });
    });

    it("shows audio indicator", async () => {
      const audioPost = makePost(23, "Has audio", { audio_url: "https://aud.com/a.mp3" });
      mockedApi.get.mockResolvedValue({ data: { posts: [audioPost], has_more: false } });
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => { expect(screen.getByText("[audio]")).toBeInTheDocument(); });
    });
  });

  describe("Error handling", () => {
    it("handles fetch error gracefully", async () => {
      mockedApi.get.mockRejectedValue(new Error("network error"));
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await act(async () => { render(<AgoraPage />); });
      await waitFor(() => { expect(spy).toHaveBeenCalled(); });
      spy.mockRestore();
    });
  });
});
