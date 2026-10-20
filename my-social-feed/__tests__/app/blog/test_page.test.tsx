import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));
jest.mock("@/components/FloatingButtons", () => () => React.createElement("div", { "data-testid": "floating-buttons" }));

import BlogListPage from "@/app/blog/page";

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

const makePosts = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    slug: `post-${i + 1}`,
    title: `Post ${i + 1}`,
    preview: "Preview text",
    featured_image_url: null,
    tags: ["tag"],
    category: null,
    reading_time_minutes: 3,
    view_count: 10,
    published_at: 1700000000,
    username: "author",
    profile_picture_url: null,
    monetized: false,
  }));

describe("BlogListPage", () => {
  it("renders blog list header", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    await act(async () => { render(<BlogListPage />); });
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("fetches and displays blog posts", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: makePosts(3), has_more: false } });
    await act(async () => { render(<BlogListPage />); });
    expect(screen.getByText("Post 1")).toBeInTheDocument();
    expect(screen.getByText("Post 2")).toBeInTheDocument();
    expect(screen.getByText("Post 3")).toBeInTheDocument();
  });

  it("shows empty state when no posts", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    await act(async () => { render(<BlogListPage />); });
    expect(screen.getByText(/No blog posts yet/)).toBeInTheDocument();
  });

  it("shows Load More button and loads more posts", async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { posts: makePosts(2), has_more: true } })
      .mockResolvedValueOnce({ data: { posts: [{ ...makePosts(1)[0], slug: "post-3", title: "Post 3" }], has_more: false } });

    await act(async () => { render(<BlogListPage />); });
    expect(screen.getByText("Load More")).toBeInTheDocument();

    await act(async () => { fireEvent.click(screen.getByText("Load More")); });
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Post 3")).toBeInTheDocument();
  });

  it("shows Write a Post button when authenticated", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    await act(async () => { render(<BlogListPage />); });
    expect(screen.getByTestId("new-blog-btn")).toBeInTheDocument();
  });
});
