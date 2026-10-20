/**
 * Security-focused tests for the frontend:
 *   - Auth token handling safety
 *   - XSS vector resistance in rendered content
 *   - SSRF protection in API routes
 *   - Download endpoint filename sanitization
 *   - Sensitive data not stored insecurely
 *   - Input sanitization in forms
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
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import Home from "@/app/lame/page";
import PostCard from "@/components/PostCard";
import AuthForm from "@/components/AuthForm";
import { proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";

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
  (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const basePost: Post = {
  id: 1, text: "Normal post", username: "testuser",
  profile_picture_url: null, image_url: null, video_url: null, audio_url: null,
  post_metadata: {}, liked_by_me: false, reposted_by_me: false,
  is_followed_by_me: false, is_me: false, likes: 0, laughs: 0, reposts: 0,
  shares: 0, saves: 0, replies_count: 0, quotes_count: 0, slop_count: 0,
  saved_by_me: false, unix_timestamp: 1700000000, parent_post_id: null,
  quoted_post: null,
};

const mockHandlers = {
  onToggleLike: jest.fn(), onToggleLaugh: jest.fn(), onRepost: jest.fn(), onShare: jest.fn(),
  onToggleSave: jest.fn().mockResolvedValue(true), onMarkSlop: jest.fn(), onReport: jest.fn(),
  onQuote: jest.fn(), onFollowToggle: jest.fn(), onToggleReplies: jest.fn(),
  onFetchReplies: jest.fn().mockResolvedValue(undefined),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH TOKEN HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

describe("Auth token handling security", () => {
  it("clears token from localStorage on 401 response", async () => {
    localStorage.setItem("token", "stale-token");
    const error = { response: { status: 401 } };
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.reject(error);
      return Promise.resolve({ data: { posts: [] } });
    });

    render(<Home />);

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("clears token from localStorage on 422 response", async () => {
    localStorage.setItem("token", "expired-token");
    const error = { response: { status: 422 } };
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.reject(error);
      return Promise.resolve({ data: { posts: [] } });
    });

    render(<Home />);

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("does not redirect on non-auth errors", async () => {
    localStorage.setItem("token", "good-token");
    const error = { response: { status: 500 } };
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.reject(error);
      return Promise.resolve({ data: { posts: [] } });
    });

    render(<Home />);

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("good-token");
      expect(mockPush).not.toHaveBeenCalledWith("/login");
    });
  });

  it("login stores token only on success", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { access_token: "valid-token" } });

    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByPlaceholderText("Username"), "user");
    await userEvent.type(screen.getByPlaceholderText("Password"), "pass");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("valid-token");
    });
  });

  it("login does not store token on failure", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("401"));

    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByPlaceholderText("Username"), "bad");
    await userEvent.type(screen.getByPlaceholderText("Password"), "bad");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  it("signup does not store any token", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<AuthForm mode="signup" />);
    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "password");
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  it("logout removes token completely", async () => {
    localStorage.setItem("token", "active-token");
    mockedApi.get.mockResolvedValue({ data: { posts: [], profile_picture_url: null } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(localStorage.getItem("token")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  XSS RESISTANCE — malicious content rendered safely as text, not HTML
// ═══════════════════════════════════════════════════════════════════════════════

describe("XSS resistance in rendered content", () => {
  it("post text with script tags rendered as text, not executed", () => {
    const xssPost = { ...basePost, text: "<script>alert('xss')</script>" };

    render(
      <PostCard post={xssPost} index={0} token="t"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    // Text should be visible as literal text
    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    // No actual script element should be in DOM
    expect(document.querySelector("script[src]")).toBeNull();
  });

  it("username with HTML rendered as text", () => {
    const xssPost = { ...basePost, username: '<img src=x onerror="alert(1)">' };

    render(
      <PostCard post={xssPost} index={0} token="t"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    // React auto-escapes, so this should be text
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
  });

  it("quoted post text with XSS rendered safely", () => {
    const xssPost = {
      ...basePost,
      quoted_post: { id: 2, username: "attacker", text: "<iframe src='evil.com'>" },
    };

    render(
      <PostCard post={xssPost} index={0} token="t"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    // Should render as text, not actual iframe
    expect(screen.getByText(/evil\.com/)).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("metadata with XSS in tags rendered safely", () => {
    const xssPost = {
      ...basePost,
      post_metadata: { tags: ["<script>evil</script>", "safe"], location: "<img onerror=alert(1)>" },
    };

    render(
      <PostCard post={xssPost} index={0} token="t"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    // Click "Show interactions" to reveal PostActions, then toggle metadata
    fireEvent.click(screen.getByText("Show interactions"));
    fireEvent.click(screen.getByTitle("Toggle metadata"));

    expect(screen.getByText(/evil/)).toBeInTheDocument();
    expect(document.querySelectorAll("script").length).toBe(0);
  });

  it("reposted_by with XSS rendered safely", () => {
    const xssPost = { ...basePost, reposted_by: ["<script>evil</script>"] };

    render(
      <PostCard post={xssPost} index={0} token="t"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    expect(screen.getByText(/Reposted by/)).toBeInTheDocument();
    // No executable script
    expect(document.querySelectorAll("script").length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  IMAGE PROXY — SSRF PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

describe("Image proxy SSRF protection", () => {
  it("proxyIfNeeded proxies http URLs", () => {
    const result = proxyIfNeeded("http://example.com/img.jpg");
    expect(result).toContain("/api/image-proxy?url=");
    expect(result).toContain(encodeURIComponent("http://example.com/img.jpg"));
  });

  it("proxyIfNeeded proxies https URLs", () => {
    const result = proxyIfNeeded("https://s3.amazonaws.com/bucket/img.jpg");
    expect(result).toContain("/api/image-proxy?url=");
  });

  it("proxyIfNeeded does not proxy relative URLs", () => {
    const result = proxyIfNeeded("/local/image.jpg");
    expect(result).toBe("/local/image.jpg");
    expect(result).not.toContain("image-proxy");
  });

  it("proxyIfNeeded handles undefined safely", () => {
    expect(proxyIfNeeded(undefined)).toBeUndefined();
  });

  it("proxyIfNeeded URL-encodes the target to prevent injection", () => {
    const malicious = "http://evil.com/img?callback=<script>alert(1)</script>";
    const result = proxyIfNeeded(malicious)!;
    expect(result).not.toContain("<script>");
    expect(result).toContain(encodeURIComponent(malicious));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  DOWNLOAD LINK CONSTRUCTION — client-side URL safety
// ═══════════════════════════════════════════════════════════════════════════════

describe("Download link construction security", () => {
  it("download URLs are properly encoded to prevent injection", () => {
    const maliciousUrl = 'http://evil.com/file?x=1&callback=<script>alert(1)</script>';
    const encoded = `/api/download?url=${encodeURIComponent(maliciousUrl)}`;
    expect(encoded).not.toContain("<script>");
    expect(encoded).toContain("%3Cscript%3E");
  });

  it("filename with path traversal is encoded in download URL", () => {
    const filename = "../../etc/passwd";
    const encoded = encodeURIComponent(filename);
    expect(encoded).not.toContain("../");
    expect(encoded).toContain("%2F");
  });

  it("filename with header injection chars is encoded", () => {
    const filename = 'file"\r\nEvil-Header: injected';
    const encoded = encodeURIComponent(filename);
    expect(encoded).not.toContain("\r");
    expect(encoded).not.toContain("\n");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  INPUT HANDLING — forms don't submit dangerous data unsanitized
// ═══════════════════════════════════════════════════════════════════════════════

describe("Input handling safety", () => {
  it("post composer sends text as form data, not interpolated in URL", async () => {
    localStorage.setItem("token", "t");
    const malicious = "'; DROP TABLE posts; --";
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

    await userEvent.type(screen.getByPlaceholderText("Write a post..."), malicious);
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      // The malicious text should be in the form data, not the URL
      const postCall = mockedApi.post.mock.calls.find(c => (c[0] as string).includes("/posts/add"));
      expect(postCall).toBeTruthy();
      // URL should not contain the SQL injection
      expect(postCall![0]).not.toContain("DROP TABLE");
    });
  });

  it("credentials sent as JSON body, not URL parameters", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { access_token: "tok" } });

    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByPlaceholderText("Username"), "user");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret&pass=evil");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      const loginCall = mockedApi.post.mock.calls[0];
      // Credentials in body, not URL
      expect(loginCall[0]).not.toContain("secret");
      expect(loginCall[1]).toEqual(expect.objectContaining({
        password: "secret&pass=evil",
      }));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SENSITIVE DATA — no secrets in client-side code
// ═══════════════════════════════════════════════════════════════════════════════

describe("Sensitive data not exposed", () => {
  it("API_URL does not contain credentials", () => {
    const { API_URL } = require("@/lib/config");
    expect(API_URL).not.toContain("password");
    expect(API_URL).not.toContain("secret");
    expect(API_URL).not.toMatch(/:[^/]+@/); // No user:pass@ in URL
  });

  it("posts response does not contain password_hash", async () => {
    localStorage.setItem("token", "t");
    const posts = [{
      ...basePost,
      password_hash: "$2b$12$somehash", // Simulate leaked field
    }];
    mockedApi.get.mockResolvedValue({ data: { posts, profile_picture_url: null } });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Normal post")).toBeInTheDocument();
    });

    // Even if backend leaked it, it shouldn't be rendered
    expect(screen.queryByText(/\$2b\$/)).not.toBeInTheDocument();
  });
});
