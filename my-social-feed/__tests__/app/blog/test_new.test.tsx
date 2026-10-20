import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));

import BlogEditorPage from "@/app/blog/new/page";

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

describe("BlogEditorPage", () => {
  it("shows login prompt when not authenticated", () => {
    render(<BlogEditorPage />);
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it("renders editor when authenticated", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByText("Create Blog Post")).toBeInTheDocument();
    expect(screen.getByTestId("blog-title")).toBeInTheDocument();
    expect(screen.getByTestId("blog-content")).toBeInTheDocument();
  });

  it("renders formatting toolbar with labels", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByTestId("toolbar-strong")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-em")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-h2")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-blockquote")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-a")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-img")).toBeInTheDocument();
  });

  it("shows word count and reading time", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "one two three four five" } });
    expect(screen.getByText("5 words")).toBeInTheDocument();
    expect(screen.getByText("1 min read")).toBeInTheDocument();
  });

  it("shows SEO panel when toggled", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.queryByTestId("seo-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("toggle-seo"));
    expect(screen.getByTestId("seo-panel")).toBeInTheDocument();
    expect(screen.getByTestId("seo-title")).toBeInTheDocument();
    expect(screen.getByTestId("seo-description")).toBeInTheDocument();
    expect(screen.getByTestId("seo-slug")).toBeInTheDocument();
  });

  it("auto-generates slug from title", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "My Amazing Post" } });
    fireEvent.click(screen.getByTestId("toggle-seo"));
    expect((screen.getByTestId("seo-slug") as HTMLInputElement).value).toBe("my-amazing-post");
  });

  it("shows monetization toggle", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByTestId("monetize-toggle")).toBeInTheDocument();
    expect(screen.queryByTestId("ad-options")).not.toBeInTheDocument();
  });

  it("shows ad options when monetized", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("monetize-toggle"));
    expect(screen.getByTestId("ad-options")).toBeInTheDocument();
    expect(screen.getByTestId("ad-minimal")).toBeInTheDocument();
    expect(screen.getByTestId("ad-standard")).toBeInTheDocument();
  });

  it("saves draft via API", async () => {
    localStorage.setItem("token", "t");
    mockedApi.post.mockResolvedValue({ data: { blog_post: { slug: "test-draft" } } });
    render(<BlogEditorPage />);

    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Test Draft" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>Draft content</p>" } });

    await act(async () => { fireEvent.click(screen.getByTestId("save-draft")); });

    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringContaining("/blog/create"),
      expect.objectContaining({ title: "Test Draft", is_draft: true })
    );
  });

  it("publishes and redirects", async () => {
    localStorage.setItem("token", "t");
    mockedApi.post.mockResolvedValue({ data: { blog_post: { slug: "published-post" } } });
    render(<BlogEditorPage />);

    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Published" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>Content</p>" } });

    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });

    expect(mockPush).toHaveBeenCalledWith("/blog/published-post");
  });

  it("shows error when title missing", async () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>Content</p>" } });

    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });

    expect(screen.getByTestId("error-msg")).toHaveTextContent("Title is required");
  });

  it("shows error when content missing", async () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Title" } });

    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });

    expect(screen.getByTestId("error-msg")).toHaveTextContent("Content is required");
  });

  it("shows featured image preview", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("featured-image"), { target: { value: "https://img.com/hero.jpg" } });
    expect(screen.getByAltText("Featured")).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    localStorage.setItem("token", "t");
    mockedApi.post.mockRejectedValue({ response: { data: { detail: "Server error" } } });
    render(<BlogEditorPage />);

    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Error Test" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>Content</p>" } });

    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });

    expect(screen.getByTestId("error-msg")).toHaveTextContent("Server error");
  });

  // ── New features ──────────────────────────────────────────────────

  it("shows labeled toolbar buttons", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Italic")).toBeInTheDocument();
    expect(screen.getByText("Heading 2")).toBeInTheDocument();
    expect(screen.getByText("Blockquote")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("shows live preview toggle", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByTestId("toggle-preview")).toBeInTheDocument();
  });

  it("shows preview panel when toggled", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-preview"));
    expect(screen.getByTestId("live-preview")).toBeInTheDocument();
    expect(screen.getByTestId("link-card-preview")).toBeInTheDocument();
  });

  it("shows SEO toolkit", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByTestId("seo-toolkit")).toBeInTheDocument();
  });

  it("shows social sharing section", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByTestId("auto-share")).toBeInTheDocument();
  });

  it("shows share links when auto-share enabled", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("auto-share"));
    expect(screen.getByTestId("share-links")).toBeInTheDocument();
    expect(screen.getByText("Twitter:")).toBeInTheDocument();
  });

  it("shows scheduler section", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.getByTestId("schedule-toggle")).toBeInTheDocument();
  });

  it("shows schedule options when enabled", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("schedule-toggle"));
    expect(screen.getByTestId("schedule-options")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-date")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-time")).toBeInTheDocument();
    expect(screen.getByText(/Optimal posting times/)).toBeInTheDocument();
  });

  it("blocks publish when AI clichés found", async () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>We need to delve into this topic and leverage synergy.</p>" } });

    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });

    expect(screen.getByTestId("error-msg")).toHaveTextContent("AI cliché");
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("allows draft save even with AI clichés", async () => {
    localStorage.setItem("token", "t");
    mockedApi.post.mockResolvedValue({ data: { blog_post: { slug: "test" } } });
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>We need to delve deep.</p>" } });

    await act(async () => { fireEvent.click(screen.getByTestId("save-draft")); });

    expect(mockedApi.post).toHaveBeenCalled();
  });

  it("inserts bold tag via toolbar", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toolbar-strong"));
    expect((screen.getByTestId("blog-content") as HTMLTextAreaElement).value).toContain("<strong>");
  });

  it("inserts link tag via toolbar", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toolbar-a"));
    expect((screen.getByTestId("blog-content") as HTMLTextAreaElement).value).toContain('<a href="">');
  });

  it("inserts image tag via toolbar", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toolbar-img"));
    expect((screen.getByTestId("blog-content") as HTMLTextAreaElement).value).toContain("<img");
  });

  it("inserts hr via toolbar", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toolbar-hr"));
    expect((screen.getByTestId("blog-content") as HTMLTextAreaElement).value).toContain("<hr");
  });

  it("inserts list via toolbar", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toolbar-ul"));
    expect((screen.getByTestId("blog-content") as HTMLTextAreaElement).value).toContain("<ul>");
  });

  it("shows OG panel when toggled", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    expect(screen.queryByTestId("og-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("toggle-og"));
    expect(screen.getByTestId("og-panel")).toBeInTheDocument();
    expect(screen.getByTestId("og-title")).toBeInTheDocument();
    expect(screen.getByTestId("og-description")).toBeInTheDocument();
    expect(screen.getByTestId("og-image")).toBeInTheDocument();
  });

  it("shows OG preview cards", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-og"));
    expect(screen.getByTestId("og-twitter-preview")).toBeInTheDocument();
    expect(screen.getByTestId("og-facebook-preview")).toBeInTheDocument();
  });

  it("shows Schedule text on publish button when scheduled", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("schedule-toggle"));
    expect(screen.getByTestId("publish-btn")).toHaveTextContent("Schedule");
  });

  // ── SEO panel input tests ─────────────────────────────────────────

  it("SEO title input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-seo"));
    fireEvent.change(screen.getByTestId("seo-title"), { target: { value: "Custom SEO Title" } });
    expect((screen.getByTestId("seo-title") as HTMLInputElement).value).toBe("Custom SEO Title");
  });

  it("SEO description input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-seo"));
    fireEvent.change(screen.getByTestId("seo-description"), { target: { value: "Custom desc" } });
    expect((screen.getByTestId("seo-description") as HTMLTextAreaElement).value).toBe("Custom desc");
  });

  it("slug input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-seo"));
    fireEvent.change(screen.getByTestId("seo-slug"), { target: { value: "custom-slug" } });
    expect((screen.getByTestId("seo-slug") as HTMLInputElement).value).toBe("custom-slug");
  });

  // ── OG input tests ────────────────────────────────────────────────

  it("OG title input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-og"));
    fireEvent.change(screen.getByTestId("og-title"), { target: { value: "OG Title" } });
    expect((screen.getByTestId("og-title") as HTMLInputElement).value).toBe("OG Title");
  });

  it("OG description input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-og"));
    fireEvent.change(screen.getByTestId("og-description"), { target: { value: "OG Desc" } });
    expect((screen.getByTestId("og-description") as HTMLTextAreaElement).value).toBe("OG Desc");
  });

  it("OG image input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("toggle-og"));
    fireEvent.change(screen.getByTestId("og-image"), { target: { value: "https://img.com/og.jpg" } });
    expect((screen.getByTestId("og-image") as HTMLInputElement).value).toBe("https://img.com/og.jpg");
  });

  // ── Schedule input tests ──────────────────────────────────────────

  it("schedule date input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("schedule-toggle"));
    fireEvent.change(screen.getByTestId("schedule-date"), { target: { value: "2026-05-01" } });
    expect((screen.getByTestId("schedule-date") as HTMLInputElement).value).toBe("2026-05-01");
  });

  it("schedule time input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.click(screen.getByTestId("schedule-toggle"));
    fireEvent.change(screen.getByTestId("schedule-time"), { target: { value: "14:00" } });
    expect((screen.getByTestId("schedule-time") as HTMLInputElement).value).toBe("14:00");
  });

  // ── Tags and category ─────────────────────────────────────────────

  it("tags input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-tags"), { target: { value: "tech, seo" } });
    expect((screen.getByTestId("blog-tags") as HTMLInputElement).value).toBe("tech, seo");
  });

  it("category input works", () => {
    localStorage.setItem("token", "t");
    render(<BlogEditorPage />);
    fireEvent.change(screen.getByTestId("blog-category"), { target: { value: "Technology" } });
    expect((screen.getByTestId("blog-category") as HTMLInputElement).value).toBe("Technology");
  });

  // ── Integration: full publish flow ────────────────────────────────

  it("complete publish flow with all fields", async () => {
    localStorage.setItem("token", "t");
    mockedApi.post.mockResolvedValue({ data: { blog_post: { slug: "complete-post" } } });
    render(<BlogEditorPage />);

    // Fill all fields
    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Complete Post" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>Full content here</p>" } });
    fireEvent.change(screen.getByTestId("featured-image"), { target: { value: "https://img.com/hero.jpg" } });
    fireEvent.change(screen.getByTestId("blog-tags"), { target: { value: "tech" } });
    fireEvent.change(screen.getByTestId("blog-category"), { target: { value: "Tech" } });

    // Enable monetization
    fireEvent.click(screen.getByTestId("monetize-toggle"));
    fireEvent.click(screen.getByTestId("ad-standard"));

    // Publish
    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });

    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringContaining("/blog/create"),
      expect.objectContaining({
        title: "Complete Post",
        monetized: true,
        ad_placement: "standard",
        is_draft: false,
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/blog/complete-post");
  });

  // ── Security: auth required ───────────────────────────────────────

  it("does not submit without token", async () => {
    render(<BlogEditorPage />);
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
    expect(screen.queryByTestId("publish-btn")).not.toBeInTheDocument();
  });

  // ── Regression: AI cliché blocker ─────────────────────────────────

  it("regression: AI clichés block publish but not drafts", async () => {
    localStorage.setItem("token", "t");
    mockedApi.post.mockResolvedValue({ data: { blog_post: { slug: "test" } } });
    render(<BlogEditorPage />);

    fireEvent.change(screen.getByTestId("blog-title"), { target: { value: "Bad Post" } });
    fireEvent.change(screen.getByTestId("blog-content"), { target: { value: "<p>We must leverage synergy to delve deeper.</p>" } });

    // Publish should fail
    await act(async () => { fireEvent.click(screen.getByTestId("publish-btn")); });
    expect(screen.getByTestId("error-msg")).toHaveTextContent("AI cliché");
    expect(mockedApi.post).not.toHaveBeenCalled();

    // Draft should succeed
    await act(async () => { fireEvent.click(screen.getByTestId("save-draft")); });
    expect(mockedApi.post).toHaveBeenCalled();
  });
});
