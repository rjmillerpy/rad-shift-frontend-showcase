import React from "react";
import { render, screen, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }), useParams: () => ({ slug: "test-post" }) }));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));
jest.mock("@/components/FloatingButtons", () => ({ hideComposer }: any) => React.createElement("div", { "data-testid": "floating-buttons" }));

import BlogReaderPage from "@/app/blog/[slug]/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  // sendBeacon must return true so the fallback api.post path is not taken
  Object.defineProperty(navigator, "sendBeacon", { value: jest.fn().mockReturnValue(true), writable: true, configurable: true });
  // Ensure api.post returns a thenable in case sendBeacon returns false
  mockedApi.post.mockResolvedValue({ data: {} });
});

const mockPost = {
  id: 1,
  slug: "test-post",
  title: "Test Blog Post",
  og_title: null,
  og_description: null,
  og_image: null,
  content_html: "<p>Hello world</p>",
  content_text: "Hello world",
  featured_image_url: null,
  seo_title: "Test Blog Post",
  seo_description: "A test post",
  tags: ["tech"],
  category: "Technology",
  monetized: false,
  ad_placement: "none",
  is_published: true,
  published_at: 1700000000,
  reading_time_minutes: 3,
  view_count: 42,
  username: "author",
  profile_picture_url: null,
};

describe("BlogReaderPage", () => {
  it("renders blog post title and content", async () => {
    mockedApi.get.mockResolvedValue({ data: { blog_post: mockPost } });
    await act(async () => { render(<BlogReaderPage />); });
    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
    expect(screen.getByTestId("blog-body")).toBeInTheDocument();
  });

  it("shows 404 for non-existent slug", async () => {
    mockedApi.get.mockRejectedValue(new Error("Not found"));
    await act(async () => { render(<BlogReaderPage />); });
    expect(screen.getByText("Post not found.")).toBeInTheDocument();
  });

  it("calls API with the slug from params", async () => {
    mockedApi.get.mockResolvedValue({ data: { blog_post: mockPost } });
    await act(async () => { render(<BlogReaderPage />); });
    expect(mockedApi.get).toHaveBeenCalledWith("/blog/slug/test-post");
  });

  it("displays author username and reading time", async () => {
    mockedApi.get.mockResolvedValue({ data: { blog_post: mockPost } });
    await act(async () => { render(<BlogReaderPage />); });
    expect(screen.getAllByText("author").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3 min read/)).toBeInTheDocument();
  });

  it("displays tags", async () => {
    mockedApi.get.mockResolvedValue({ data: { blog_post: mockPost } });
    await act(async () => { render(<BlogReaderPage />); });
    expect(screen.getByText("tech")).toBeInTheDocument();
  });

  it.each([
    ["none", false],
    ["standard", true],
  ])("strips scripts and event handlers from stored HTML (ads: %s)", async (placement, monetized) => {
    const dirty = '<p>safe</p><img src="x" onerror="window.__pwned=1"><script>window.__pwned=1</script>';
    mockedApi.get.mockResolvedValue({
      data: { blog_post: { ...mockPost, content_html: dirty, monetized, ad_placement: placement } },
    });
    await act(async () => { render(<BlogReaderPage />); });
    const body = screen.getByTestId("blog-body");
    expect(body.innerHTML).toContain("safe");
    expect(body.innerHTML).not.toContain("onerror");
    expect(body.querySelector("script")).toBeNull();
  });
});
