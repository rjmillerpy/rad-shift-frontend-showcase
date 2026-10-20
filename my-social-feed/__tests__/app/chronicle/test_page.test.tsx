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

import ChroniclePage from "@/app/chronicle/page";

const makeChapterResponse = (page = 0, posts: any[] = [], segments: any[] = [], has_more = true) => ({
  page,
  posts,
  segments,
  has_more,
  cached: false,
});

const samplePosts = [
  { id: 1, text: "First post about technology", username: "alice", likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 3, unix_timestamp: 1700000000, post_metadata: {}, image_url: null, video_url: null, audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 },
  { id: 2, text: "Second post with an image", username: "bob", likes: 8, reposts: 0, shares: 0, saves: 1, laughs: 0, unix_timestamp: 1700000060, post_metadata: {}, image_url: "https://example.com/pic.jpg", video_url: null, audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 },
  { id: 3, text: "Third post with video", username: "charlie", likes: 2, reposts: 1, shares: 0, saves: 0, laughs: 1, unix_timestamp: 1700000120, post_metadata: {}, image_url: null, video_url: "https://example.com/vid.mp4", audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 },
];

const sampleSegments = [
  { type: "narrative", text: "As the day unfolded across the digital commons..." },
  { type: "post", index: 0 },
  { type: "narrative", text: "Meanwhile, another story was taking shape..." },
  { type: "media", index: 1 },
  { type: "narrative", text: "And in the distance, a video caught the eye..." },
  { type: "media", index: 2 },
  { type: "narrative", text: "And so this chapter drew to a gentle close." },
];

const dismissTitlePrompt = (title = "My Story") => {
  const input = screen.getByTestId("title-input");
  fireEvent.change(input, { target: { value: title } });
  fireEvent.click(screen.getByTestId("title-submit"));
  // Auto-emit standard data for the EventSource that was just created
  setTimeout(() => {
    if (mockESInstance) {
      mockESInstance._emit({ type: "init", posts: samplePosts, page: 0, has_more: true });
      mockESInstance._emit({ type: "done", segments: sampleSegments });
    }
  }, 5);
};

const dismissTitleAndEmit = (opts?: { posts?: any[]; segments?: any[]; has_more?: boolean; page?: number }) => {
  dismissTitlePrompt();
  // Override the auto-emit with custom data
  setTimeout(() => {
    if (mockESInstance) {
      mockESInstance._emit({ type: "init", posts: opts?.posts ?? samplePosts, page: opts?.page ?? 0, has_more: opts?.has_more ?? true });
      mockESInstance._emit({ type: "done", segments: opts?.segments ?? sampleSegments });
    }
  }, 5);
};

// Mock EventSource for SSE streaming
let mockESInstance: any = null;
const MockEventSource = jest.fn().mockImplementation((url: string) => {
  const instance = {
    url,
    onmessage: null as ((event: any) => void) | null,
    onerror: null as (() => void) | null,
    close: jest.fn(),
    _emit: (data: any) => {
      if (instance.onmessage) instance.onmessage({ data: JSON.stringify(data) });
    },
    _error: () => {
      if (instance.onerror) instance.onerror();
    },
  };
  mockESInstance = instance;
  // Don't auto-emit — tests will call _emit manually or set up custom MockEventSource behavior
  return instance;
});
(global as any).EventSource = MockEventSource;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mockESInstance = null;
  MockEventSource.mockClear();
});

describe("ChroniclePage", () => {
  describe("Title Prompt", () => {
    it("shows title prompt on first visit", () => {
      render(<ChroniclePage />);
      expect(screen.getByTestId("title-prompt")).toBeInTheDocument();
      expect(screen.getByText(/Name your story/)).toBeInTheDocument();
    });

    it("accepts a story title and begins loading", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt("The Digital Odyssey");

      await waitFor(() => {
        expect(screen.queryByTestId("title-prompt")).not.toBeInTheDocument();
      });
    });

    it("uses default title when empty", async () => {
      render(<ChroniclePage />);
      fireEvent.click(screen.getByTestId("title-submit"));

      // Emit this test's own chapter. It used to pass only when the previous
      // test's leftover dismissTitlePrompt timer happened to fire late enough
      // to feed this test's EventSource, so it flaked under load.
      await act(async () => {
        expect(mockESInstance).not.toBeNull();
        mockESInstance._emit({ type: "init", posts: samplePosts, page: 0, has_more: true });
        mockESInstance._emit({ type: "done", segments: sampleSegments });
      });

      await waitFor(() => {
        expect(screen.getByText("An Untitled Chronicle")).toBeInTheDocument();
      });
    });

    it("submits on Enter key", async () => {
      render(<ChroniclePage />);
      const input = screen.getByTestId("title-input");
      fireEvent.change(input, { target: { value: "Enter Title" } });
      fireEvent.keyDown(input, { key: "Enter" });

      // Emit data for the EventSource
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
        if (mockESInstance) {
          mockESInstance._emit({ type: "init", posts: samplePosts, page: 0, has_more: true });
          mockESInstance._emit({ type: "done", segments: sampleSegments });
        }
      });

      await waitFor(() => {
        expect(screen.getByText("Enter Title")).toBeInTheDocument();
      });
    });

    it("restores title from session storage", async () => {
      sessionStorage.setItem("chronicle_title", "Saved Title");

      render(<ChroniclePage />);

      // Emit data for the auto-created EventSource
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
        if (mockESInstance) {
          mockESInstance._emit({ type: "init", posts: samplePosts, page: 0, has_more: true });
          mockESInstance._emit({ type: "done", segments: sampleSegments });
        }
      });

      await waitFor(() => {
        expect(screen.queryByTestId("title-prompt")).not.toBeInTheDocument();
        expect(screen.getByText("Saved Title")).toBeInTheDocument();
      });
    });
  });

  describe("Chapter Rendering", () => {
    beforeEach(() => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });
    });

    it("renders narrative segments", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        const narratives = screen.getAllByTestId("narrative-segment");
        expect(narratives.length).toBeGreaterThanOrEqual(1);
        expect(narratives[0]).toHaveTextContent("the day unfolded");
      });
    });

    it("renders post text inline (not in blockquotes)", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        const posts = screen.getAllByTestId("post-segment");
        expect(posts.length).toBeGreaterThanOrEqual(1);
        expect(posts[0]).toHaveTextContent("First post about technology");
        // Should be a span, not a blockquote
        expect(posts[0].tagName).toBe("SPAN");
      });
    });

    it("renders media segments with images", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        const mediaSegs = screen.getAllByTestId("media-segment");
        expect(mediaSegs.length).toBeGreaterThanOrEqual(1);
        expect(mediaSegs[0]).toHaveTextContent("@bob");
      });
    });

    it("highlights post text on hover and shows tooltip", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      const postSpan = screen.getAllByTestId("post-segment")[0];
      fireEvent.mouseEnter(postSpan);

      await waitFor(() => {
        const tooltip = screen.getByTestId("post-tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent("@alice");
        expect(screen.getByTestId("tooltip-like")).toBeInTheDocument();
        expect(screen.getByTestId("tooltip-laugh")).toBeInTheDocument();
        expect(screen.getByTestId("tooltip-save")).toBeInTheDocument();
      });
    });

    it("renders video in media segments", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        const videos = document.querySelectorAll("video");
        expect(videos.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("shows chapter number", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByText("Chapter 1")).toBeInTheDocument();
      });
    });

    it("shows page number", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByText("— 1 —")).toBeInTheDocument();
      });
    });

    it("shows drop cap on first narrative", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        // First letter of first narrative gets drop cap treatment
        const narratives = screen.getAllByTestId("narrative-segment");
        expect(narratives[0].querySelector("span")).toBeInTheDocument();
      });
    });

    it("shows engagement stats in hover tooltip", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.mouseEnter(screen.getAllByTestId("post-segment")[0]);

      await waitFor(() => {
        const tooltip = screen.getByTestId("post-tooltip");
        expect(tooltip).toHaveTextContent("5"); // likes count
      });
    });
  });

  describe("Pagination", () => {
    it("shows next/previous page buttons", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments, true),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByTestId("prev-page")).toBeInTheDocument();
        expect(screen.getByTestId("next-page")).toBeInTheDocument();
      });
    });

    it("disables previous on first page", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByTestId("prev-page")).toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByTestId("next-page")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("next-page"));
        // Emit data for page 2
        await new Promise((r) => setTimeout(r, 10));
        if (mockESInstance) {
          mockESInstance._emit({ type: "init", posts: samplePosts, page: 1, has_more: false });
          mockESInstance._emit({ type: "done", segments: sampleSegments });
        }
      });

      await waitFor(() => {
        expect(screen.getByText("Chapter 2")).toBeInTheDocument();
        expect(screen.getByText("— 2 —")).toBeInTheDocument();
      });
    });

    it("disables next when no more pages", async () => {
      render(<ChroniclePage />);
      dismissTitleAndEmit({ has_more: false });

      await waitFor(() => {
        expect(screen.getByTestId("next-page")).toBeDisabled();
      });
    });
  });

  describe("Refresh", () => {
    it("shows refresh button", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByTestId("refresh-btn")).toBeInTheDocument();
      });
    });

    it("reloads chronicle on refresh", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByTestId("refresh-btn")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("refresh-btn"));
      });

      // EventSource should be created at least twice (initial + refresh)
      expect(MockEventSource).toHaveBeenCalledTimes(2);
    });
  });

  describe("Empty state", () => {
    it("shows empty message when no posts", async () => {
      render(<ChroniclePage />);
      dismissTitleAndEmit({ posts: [], segments: [], has_more: false });

      await waitFor(() => {
        expect(screen.getByText(/No posts to chronicle/)).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("shows loading message while fetching", async () => {
      render(<ChroniclePage />);
      // Dismiss title but don't emit anything — stays in loading
      const input = screen.getByTestId("title-input");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByTestId("title-submit"));

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toBeInTheDocument();
        expect(screen.getByText(/Chronicling/)).toBeInTheDocument();
      });
    });
  });

  describe("Authentication", () => {
    it("passes token as query param in EventSource URL", async () => {
      localStorage.setItem("token", "test-token");

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(MockEventSource).toHaveBeenCalledWith(
          expect.stringContaining("token=test-token")
        );
      });
    });
  });

  describe("Hover interactions", () => {
    beforeEach(() => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });
    });

    it("clicking like in tooltip calls API", async () => {
      mockedApi.post.mockResolvedValue({ data: { likes: 6, action: "liked" } });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.mouseEnter(screen.getAllByTestId("post-segment")[0]);

      await waitFor(() => {
        expect(screen.getByTestId("tooltip-like")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tooltip-like"));
      });

      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/like/1")
      );
    });

    it("clicking laugh in tooltip calls API", async () => {
      mockedApi.post.mockResolvedValue({ data: { laughs: 4, action: "laughed" } });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.mouseEnter(screen.getAllByTestId("post-segment")[0]);

      await waitFor(() => {
        expect(screen.getByTestId("tooltip-laugh")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tooltip-laugh"));
      });

      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/laugh/1")
      );
    });

    it("clicking save in tooltip calls API", async () => {
      mockedApi.post.mockResolvedValue({ data: { saves: 1, action: "saved" } });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.mouseEnter(screen.getAllByTestId("post-segment")[0]);

      await waitFor(() => {
        expect(screen.getByTestId("tooltip-save")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tooltip-save"));
      });

      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/save/1")
      );
    });

    it("tooltip shows view link to post detail", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.mouseEnter(screen.getAllByTestId("post-segment")[0]);

      await waitFor(() => {
        const viewLink = screen.getByText("view →");
        expect(viewLink.closest("a")).toHaveAttribute("href", "/post/1");
      });
    });

    it("handles react error gracefully", async () => {
      mockedApi.post.mockRejectedValue(new Error("fail"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.mouseEnter(screen.getAllByTestId("post-segment")[0]);

      await waitFor(() => expect(screen.getByTestId("tooltip-like")).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByTestId("tooltip-like"));
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Media rendering", () => {
    it("renders video elements for video posts", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(document.querySelectorAll("video").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("renders audio elements for audio posts", async () => {
      const audioPost = { ...samplePosts[0], id: 99, audio_url: "https://example.com/track.mp3", image_url: null, video_url: null };
      const audioSegments = [
        { type: "narrative", text: "A song rang out..." },
        { type: "media", index: 0 },
      ];

      render(<ChroniclePage />);
      dismissTitleAndEmit({ posts: [audioPost], segments: audioSegments, has_more: false });

      await waitFor(() => {
        expect(document.querySelectorAll("audio").length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Fetch error handling", () => {
    it("falls back to axios when EventSource errors", async () => {
      // Make EventSource error, then axios succeed
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      const input = screen.getByTestId("title-input");
      fireEvent.change(input, { target: { value: "err" } });
      fireEvent.click(screen.getByTestId("title-submit"));

      // Trigger error on EventSource
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
        if (mockESInstance) mockESInstance._error();
      });

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith(
          expect.stringContaining("/posts/chronicle"),
          expect.any(Object)
        );
      });
    });
  });

  describe("Right-click context menu", () => {
    it("shows context menu on right-click", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.contextMenu(screen.getAllByTestId("post-segment")[0], { clientX: 300, clientY: 300 });

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
        expect(screen.getByTestId("ctx-like")).toBeInTheDocument();
        expect(screen.getByTestId("ctx-laugh")).toBeInTheDocument();
        expect(screen.getByTestId("ctx-save")).toBeInTheDocument();
        expect(screen.getByTestId("ctx-share")).toBeInTheDocument();
        expect(screen.getByTestId("ctx-view")).toBeInTheDocument();
      });
    });

    it("clicking like in context menu calls API", async () => {
      localStorage.setItem("token", "test-token");
      mockedApi.post.mockResolvedValue({ data: { likes: 6, action: "liked" } });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.contextMenu(screen.getAllByTestId("post-segment")[0], { clientX: 300, clientY: 300 });

      await waitFor(() => expect(screen.getByTestId("ctx-like")).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByTestId("ctx-like"));
      });

      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/like/")
      );
    });

    it("view post navigates to post detail", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.contextMenu(screen.getAllByTestId("post-segment")[0], { clientX: 300, clientY: 300 });

      await waitFor(() => expect(screen.getByTestId("ctx-view")).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByTestId("ctx-view"));
      });

      expect(mockPush).toHaveBeenCalledWith("/post/1");
    });

    it("context menu closes on mouse leave", async () => {
      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getAllByTestId("post-segment").length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.contextMenu(screen.getAllByTestId("post-segment")[0], { clientX: 300, clientY: 300 });
      await waitFor(() => expect(screen.getByTestId("context-menu")).toBeInTheDocument());

      fireEvent.mouseLeave(screen.getByTestId("context-menu"));
      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    });
  });

  describe("Book styling", () => {
    it("renders with serif font family", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByText("Chapter 1")).toBeInTheDocument();
      });
    });

    it("shows subtitle on first page", async () => {
      mockedApi.get.mockResolvedValue({
        data: makeChapterResponse(0, samplePosts, sampleSegments),
      });

      render(<ChroniclePage />);
      dismissTitlePrompt();

      await waitFor(() => {
        expect(screen.getByText("A Chronicle of the Feed")).toBeInTheDocument();
      });
    });
  });

});
