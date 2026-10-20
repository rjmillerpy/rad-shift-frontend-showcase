import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));

import MosaicPage from "@/app/mosaic/page";

const makePost = (id: number, text: string, overrides: any = {}) => ({
  id, text, username: `user${id}`, likes: id, reposts: 0, shares: 0, saves: 0, laughs: id,
  unix_timestamp: 1700000000 + id * 60, post_metadata: {}, profile_picture_url: null,
  image_url: null, video_url: null, audio_url: null, image_urls: null,
  liked_by_me: false, laughed_by_me: false, saved_by_me: false,
  replies_count: 0, quotes_count: 0, slop_count: 0, ...overrides,
});

const samplePosts = [
  makePost(1, "Short text post"),
  makePost(2, "Image post", { image_url: "https://img.com/pic.jpg" }),
  makePost(3, "A".repeat(400)),  // Long text
  makePost(4, "Video post", { video_url: "https://vid.com/v.mp4" }),
  makePost(5, "Audio post", { audio_url: "https://aud.com/a.mp3" }),
];

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockedApi.get.mockResolvedValue({ data: { posts: samplePosts, has_more: true } });
});

describe("MosaicPage", () => {
  it("renders the mosaic header", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByText("Mosaic")).toBeInTheDocument());
  });

  it("renders the grid", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("mosaic-grid")).toBeInTheDocument());
  });

  it("renders tiles for each post", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => {
      expect(screen.getByTestId("tile-1")).toBeInTheDocument();
      expect(screen.getByTestId("tile-2")).toBeInTheDocument();
      expect(screen.getByTestId("tile-3")).toBeInTheDocument();
    });
  });

  it("shows username badge on tiles", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => {
      expect(screen.getByText("@user1")).toBeInTheDocument();
    });
  });

  it("shows hover overlay with details", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId("tile-1"));
    expect(screen.getByTestId("hover-1")).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
  });

  it("hides hover on mouse leave", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId("tile-1"));
    expect(screen.getByTestId("hover-1")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId("tile-1"));
    expect(screen.queryByTestId("hover-1")).not.toBeInTheDocument();
  });

  it("navigates to post detail on tile click", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

    // A real link: keyboard-focusable, and middle-click / open-in-new-tab work.
    const tile = screen.getByTestId("tile-1");
    expect(tile.tagName).toBe("A");
    expect(tile).toHaveAttribute("href", "/post/1");
  });

  it("shows tabs for Discover and Following", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => {
      expect(screen.getByTestId("tab-algo")).toBeInTheDocument();
      expect(screen.getByTestId("tab-following")).toBeInTheDocument();
    });
  });

  it("switches to following tab", async () => {
    localStorage.setItem("token", "test-token");
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("tab-following")).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByTestId("tab-following")); });

    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining("/posts/following"), expect.any(Object)
    );
  });

  it("shows load more button when has_more", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("load-more")).toBeInTheDocument());
  });

  it("hides load more when no more posts", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: samplePosts, has_more: false } });
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.queryByTestId("load-more")).not.toBeInTheDocument());
  });

  it("shows video play indicator", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => {
      const videoTile = screen.getByTestId("tile-4");
      expect(videoTile.querySelector("div[style*='border-left']")).toBeInTheDocument();
    });
  });

  it("shows multi-image count indicator", async () => {
    const multiImg = makePost(10, "Multi", { image_url: "https://img.com/1.jpg", image_urls: ["https://img.com/1.jpg", "https://img.com/2.jpg", "https://img.com/3.jpg"] });
    mockedApi.get.mockResolvedValue({ data: { posts: [multiImg], has_more: false } });
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByText("📷 3")).toBeInTheDocument());
  });

  it("shows empty state", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByText(/No posts to display/)).toBeInTheDocument());
  });

  it("shows text on non-image tiles", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByText("Short text post")).toBeInTheDocument());
  });

  it("shows engagement stats on hover", async () => {
    await act(async () => { render(<MosaicPage />); });
    await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

    fireEvent.mouseEnter(screen.getByTestId("tile-1"));
    expect(screen.getByText("❤️ 1")).toBeInTheDocument();
  });

  describe("Honeycomb layout", () => {
    it("applies hexagon clip-path to tiles", async () => {
      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

      const tile = screen.getByTestId("tile-1");
      expect(tile.style.clipPath).toContain("polygon(50%");
    });

    it("positions tiles absolutely within the grid", async () => {
      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

      const tile = screen.getByTestId("tile-1");
      expect(tile.style.position).toBe("absolute");
    });

    it("places first tile at origin", async () => {
      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

      const tile = screen.getByTestId("tile-1");
      expect(tile.getAttribute("data-hex-x")).toBe("0");
      expect(tile.getAttribute("data-hex-y")).toBe("0");
    });

    it("offsets second-row tiles horizontally for interlocking", async () => {
      // Need 6+ posts so post 6 lands in row 1 (row 0 has 5 tiles)
      const manyPosts = Array.from({ length: 9 }, (_, i) => makePost(i + 1, `Post ${i + 1}`));
      mockedApi.get.mockResolvedValue({ data: { posts: manyPosts, has_more: false } });

      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-6")).toBeInTheDocument());

      // Post 6 is first in row 1 (odd row), should be offset by HEX_W/2 = 100
      const tile6 = screen.getByTestId("tile-6");
      const x = parseInt(tile6.getAttribute("data-hex-x")!);
      expect(x).toBe(100); // half of 200px hex width
    });

    it("overlaps rows vertically for honeycomb nesting", async () => {
      const manyPosts = Array.from({ length: 9 }, (_, i) => makePost(i + 1, `Post ${i + 1}`));
      mockedApi.get.mockResolvedValue({ data: { posts: manyPosts, has_more: false } });

      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-6")).toBeInTheDocument());

      // Row 1 y should be 0.75 * HEX_H, not a full HEX_H away
      const tile6 = screen.getByTestId("tile-6");
      const y = parseInt(tile6.getAttribute("data-hex-y")!);
      // HEX_H = 230, so row 1 top = 230 * 0.75 = 172.5
      expect(y).toBeLessThan(230);
      expect(y).toBeGreaterThan(100);
    });

    it("tiles have uniform hex dimensions", async () => {
      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

      const tile = screen.getByTestId("tile-1");
      expect(tile.style.width).toBe("200px");
      expect(tile.style.height).toBe("230px");
    });

    it("scales up hovered tile with higher z-index", async () => {
      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-1")).toBeInTheDocument());

      const tile = screen.getByTestId("tile-1");
      fireEvent.mouseEnter(tile);
      expect(tile.style.transform).toBe("scale(1.08)");
      expect(tile.style.filter).toContain("drop-shadow");
      expect(tile.style.zIndex).toBe("10");
    });

    it("row 1 has fewer tiles than row 0 for staggered pattern", async () => {
      const manyPosts = Array.from({ length: 9 }, (_, i) => makePost(i + 1, `Post ${i + 1}`));
      mockedApi.get.mockResolvedValue({ data: { posts: manyPosts, has_more: false } });

      await act(async () => { render(<MosaicPage />); });
      await waitFor(() => expect(screen.getByTestId("tile-9")).toBeInTheDocument());

      // Row 0: tiles 1-5 at y=0, Row 1: tiles 6-9 at y=172
      // Verify tile 5 (last in row 0) and tile 6 (first in row 1) have different y
      const tile5y = parseInt(screen.getByTestId("tile-5").getAttribute("data-hex-y")!);
      const tile6y = parseInt(screen.getByTestId("tile-6").getAttribute("data-hex-y")!);
      expect(tile5y).toBe(0);
      expect(tile6y).toBeGreaterThan(0);

      // Row 1 has 4 tiles (6,7,8,9), row 0 had 5 (1,2,3,4,5)
      const row1Tiles = [6, 7, 8, 9].map(id =>
        parseInt(screen.getByTestId(`tile-${id}`).getAttribute("data-hex-y")!)
      );
      // All row 1 tiles should share the same y
      expect(new Set(row1Tiles).size).toBe(1);
    });
  });
});
