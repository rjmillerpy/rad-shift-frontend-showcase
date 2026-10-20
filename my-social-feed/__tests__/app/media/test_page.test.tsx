import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import MediaPage from "@/app/media/page";
import type { Post } from "@/types/post";

// Mock @/lib/api
jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));
const mockedApi = api as jest.Mocked<typeof api>;

// Mock usePostActions
jest.mock("@/hooks/usePostActions", () => ({
  usePostActions: () => ({
    toggleLike: jest.fn(),
    toggleLaugh: jest.fn(),
    toggleRepost: jest.fn(),
    toggleSave: jest.fn(),
    sharePost: jest.fn(),
    reportSlop: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/media",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock PostCard to simplify — we're testing the page, not PostCard
jest.mock("@/components/PostCard", () => {
  return function MockPostCard({ post }: { post: Post }) {
    return <div data-testid={`post-${post.id}`}>{post.text}</div>;
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn().mockReturnValue("fake-token"),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const makePost = (id: number, overrides: Partial<Post> = {}): Post => ({
  id,
  text: `Media post ${id}`,
  username: `user${id}`,
  likes: 0,
  reposts: 0,
  shares: 0,
  saves: 0,
  laughs: 0,
  unix_timestamp: 1700000000,
  post_metadata: {},
  profile_picture_url: null,
  image_url: null,
  video_url: null,
  audio_url: "https://example.com/audio.mp3",
  liked_by_me: false,
  laughed_by_me: false,
  saved_by_me: false,
  replies_count: 0,
  quotes_count: 0,
  slop_count: 0,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.get.mockResolvedValue({
    data: { posts: [makePost(1), makePost(2)], has_more: false },
  });
});

describe("MediaPage", () => {
  it("renders tab buttons (All Media, Audio, Video)", async () => {
    render(<MediaPage />);

    await waitFor(() => {
      expect(screen.getByText("All Media")).toBeInTheDocument();
      expect(screen.getByText("Audio")).toBeInTheDocument();
      expect(screen.getByText("Video")).toBeInTheDocument();
    });
  });

  it("fetches /posts/media on mount", async () => {
    render(<MediaPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith("/posts/media", {
        params: { media_type: "all", offset: 0, limit: 20 },
      });
    });
  });

  it("renders fetched posts", async () => {
    render(<MediaPage />);

    await waitFor(() => {
      expect(screen.getByTestId("post-1")).toBeInTheDocument();
      expect(screen.getByTestId("post-2")).toBeInTheDocument();
    });
  });

  it("switching to Audio tab calls with correct media_type param", async () => {
    render(<MediaPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });

    mockedApi.get.mockResolvedValue({
      data: { posts: [makePost(3, { audio_url: "https://example.com/a.mp3" })], has_more: false },
    });

    fireEvent.click(screen.getByText("Audio"));

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith("/posts/media", {
        params: { media_type: "audio", offset: 0, limit: 20 },
      });
    });
  });

  it("switching to Video tab calls with correct media_type param", async () => {
    render(<MediaPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });

    mockedApi.get.mockResolvedValue({
      data: { posts: [makePost(4, { video_url: "https://example.com/v.mp4" })], has_more: false },
    });

    fireEvent.click(screen.getByText("Video"));

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith("/posts/media", {
        params: { media_type: "video", offset: 0, limit: 20 },
      });
    });
  });

  it('shows "No media posts found" when empty', async () => {
    mockedApi.get.mockResolvedValue({
      data: { posts: [], has_more: false },
    });

    render(<MediaPage />);

    await waitFor(() => {
      expect(screen.getByText("No media posts found.")).toBeInTheDocument();
    });
  });

  it("shows Load More button when has_more is true", async () => {
    mockedApi.get.mockResolvedValue({
      data: { posts: [makePost(1)], has_more: true },
    });

    render(<MediaPage />);

    await waitFor(() => {
      expect(screen.getByText("Load More")).toBeInTheDocument();
    });
  });

  it("does not show Load More button when has_more is false", async () => {
    mockedApi.get.mockResolvedValue({
      data: { posts: [makePost(1)], has_more: false },
    });

    render(<MediaPage />);

    await waitFor(() => {
      expect(screen.getByTestId("post-1")).toBeInTheDocument();
    });

    expect(screen.queryByText("Load More")).not.toBeInTheDocument();
  });

  test.each([
    { tab: "Audio", mediaType: "audio" },
    { tab: "Video", mediaType: "video" },
  ])("clicking $tab tab fetches with media_type=$mediaType", async ({ tab, mediaType }) => {
    render(<MediaPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalled();
    });

    mockedApi.get.mockClear();
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });

    fireEvent.click(screen.getByText(tab));

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith("/posts/media", {
        params: { media_type: mediaType, offset: 0, limit: 20 },
      });
    });
  });
});
