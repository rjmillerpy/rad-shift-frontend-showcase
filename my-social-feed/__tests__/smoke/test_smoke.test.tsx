/**
 * Smoke tests — quick sanity checks that pages render and
 * critical user flows work. Run first to catch fundamental breakage.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import axios from "axios";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
jest.mock("axios");
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "1", username: "testuser" }),
  useSearchParams: () => ({ get: (k: string) => k === "q" ? "test" : null }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
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
  (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Smoke: Pages render", () => {
  it("Home page renders without crash", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    const Home = require("@/app/lame/page").default;
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Welcome to the Feed")).toBeInTheDocument();
    });
  });

  it("Login page renders without crash", () => {
    const LoginPage = require("@/app/login/page").default;
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("Signup page renders without crash", () => {
    const SignupPage = require("@/app/signup/page").default;
    render(<SignupPage />);
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });

  it("Profile page renders without crash", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({
      data: { username: "testuser", bio: null, profile_picture_url: null, posts: [] },
    });
    const ProfilePage = require("@/app/profile/page").default;
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Your Profile")).toBeInTheDocument();
    });
  });

  it("Search page renders without crash", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, users: [] } });
    const SearchPage = require("@/app/search/page").default;
    render(<SearchPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search posts and users...")).toBeInTheDocument();
    });
  });

  it("Verify page renders without crash", () => {
    const VerifyPage = require("@/app/verify/page").default;
    render(<VerifyPage />);
    // With no token in search params, shows error state
    expect(screen.getByText("Email Verification")).toBeInTheDocument();
  });
});

describe("Smoke: Critical components render", () => {
  it("PostActions renders all buttons", () => {
    const PostActions = require("@/components/PostActions").default;
    render(
      <PostActions
        postId={1} index={0} posterUsername="test"
        counts={{ likes: 0, reposts: 0, shares: 0 }}
        hasMetadata={false} metadataExpanded={false}
        onToggleMetadata={jest.fn()} onToggleLike={jest.fn()}
        onRepost={jest.fn()} onShare={jest.fn()}
        onToggleSave={jest.fn().mockResolvedValue(true)}
        captureElementId="post-1" onMarkSlop={jest.fn()} onReport={jest.fn()}
      />
    );
    expect(screen.getByTitle("Like")).toBeInTheDocument();
    expect(screen.getByTitle("Repost")).toBeInTheDocument();
    expect(screen.getByTitle("Share")).toBeInTheDocument();
  });

  it("AuthForm renders in both modes", () => {
    const AuthForm = require("@/components/AuthForm").default;
    const { unmount } = render(<AuthForm mode="login" />);
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    unmount();

    render(<AuthForm mode="signup" />);
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("PostComposer renders form elements", () => {
    const PostComposer = require("@/components/PostComposer").default;
    render(
      <PostComposer token="t" quotePreview={null}
        onClearQuote={jest.fn()} onPostCreated={jest.fn()} quotePostId={null} />
    );
    expect(screen.getByPlaceholderText("Write a post...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
  });
});

describe("Smoke: Critical user flows", () => {
  it("login flow stores token", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { access_token: "smoke-token", email_verified: true },
    });
    const AuthForm = require("@/components/AuthForm").default;
    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "user" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("smoke-token");
    });
  });

  it("feed loads posts on mount", async () => {
    const posts = [{ id: 1, text: "Smoke post", username: "u", likes: 0, reposts: 0,
      shares: 0, saves: 0, unix_timestamp: 1700000000, post_metadata: {},
      replies_count: 0, quotes_count: 0, slop_count: 0 }];
    mockedApi.get.mockResolvedValue({ data: { posts, has_more: false } });

    const Home = require("@/app/lame/page").default;
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Smoke post")).toBeInTheDocument();
    });
  });

  it("search button exists on home page", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    const Home = require("@/app/lame/page").default;
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });
  });

  it("FAB exists when logged in", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false, profile_picture_url: null } });
    const Home = require("@/app/lame/page").default;
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New post" })).toBeInTheDocument();
    });
  });

  it("tabs render on home page", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [], has_more: false } });
    const Home = require("@/app/lame/page").default;
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Algo" })).toBeInTheDocument();
    });
  });

  it("Bubbles feed page renders without crash", () => {
    const BubblesPage = require("@/app/bubbles/page").default;
    render(<BubblesPage />);
    expect(screen.getByTitle("Algo")).toBeInTheDocument();
    expect(screen.getByTitle("Technology")).toBeInTheDocument();
  });
});
