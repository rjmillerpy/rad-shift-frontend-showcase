/**
 * Integration test: profile management flow.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ username: "otheruser" }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import ProfilePage from "@/app/profile/page";
import UserProfilePage from "@/app/profile/[username]/page";

const makeProfileResponse = (overrides: any = {}) => ({
  username: "myuser",
  bio: "Original bio",
  profile_picture_url: null,
  posts: [
    {
      id: 1,
      text: "My post",
      username: "myuser",
      likes: 2, reposts: 0, shares: 1, saves: 0, laughs: 0,
      unix_timestamp: 1700000000,
      post_metadata: { tags: ["react"], location: "NYC" },
      image_url: null,
      video_url: null,
      audio_url: null,
      profile_picture_url: null,
      replies_count: 0, quotes_count: 0, slop_count: 0,
    },
  ],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Profile page integration", () => {
  it("loads profile data and displays posts tab by default", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: makeProfileResponse() });
      if (url.includes("/posts/saved")) return Promise.resolve({ data: { posts: [] } });
      if (url.includes("/posts/drafts")) return Promise.resolve({ data: { drafts: [] } });
      return Promise.resolve({ data: {} });
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Your Profile")).toBeInTheDocument();
      expect(screen.getByText("My post")).toBeInTheDocument();
    });
  });

  it("switches between posts, saved, and drafts tabs", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: makeProfileResponse() });
      if (url.includes("/posts/saved")) return Promise.resolve({
        data: { posts: [{ id: 10, text: "Saved post", username: "alice", likes: 0, reposts: 0, shares: 0, saves: 1, laughs: 0, unix_timestamp: 1700000000, post_metadata: {}, image_url: null, video_url: null, audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 }] },
      });
      if (url.includes("/posts/drafts")) return Promise.resolve({
        data: { drafts: [{ id: 99, text: "Draft post", unix_timestamp: 1700000000, post_metadata: {}, image_url: null, video_url: null, audio_url: null }] },
      });
      return Promise.resolve({ data: {} });
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("My post")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "saved" }));
    await waitFor(() => {
      expect(screen.getByText("Saved post")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "drafts" }));
    await waitFor(() => {
      expect(screen.getByText("Draft post")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "posts" }));
    await waitFor(() => {
      expect(screen.getByText("My post")).toBeInTheDocument();
    });
  });

  it("updates bio via API", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: makeProfileResponse() });
      if (url.includes("/posts/saved")) return Promise.resolve({ data: { posts: [] } });
      if (url.includes("/posts/drafts")) return Promise.resolve({ data: { drafts: [] } });
      return Promise.resolve({ data: {} });
    });
    mockedApi.put.mockResolvedValue({ data: { message: "Profile updated" } });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Your Profile")).toBeInTheDocument();
    });

    const bioTextarea = screen.getByRole("textbox");
    await userEvent.clear(bioTextarea);
    await userEvent.type(bioTextarea, "New bio");

    fireEvent.click(screen.getByRole("button", { name: "Update Bio" }));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith(
        expect.stringContaining("/profile/me"),
        { bio: "New bio" }
      );
    });
  });

  it("publishes draft and refreshes", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes("/profile/me")) return Promise.resolve({ data: makeProfileResponse() });
      if (url.includes("/posts/saved")) return Promise.resolve({ data: { posts: [] } });
      if (url.includes("/posts/drafts")) return Promise.resolve({
        data: { drafts: [{ id: 42, text: "My draft", unix_timestamp: 1700000000, post_metadata: {}, image_url: null, video_url: null, audio_url: null }] },
      });
      return Promise.resolve({ data: {} });
    });
    mockedApi.post.mockResolvedValue({ data: { status: "published", post_id: 42 } });

    render(<ProfilePage />);

    await waitFor(() => screen.getByRole("button", { name: "drafts" }));
    fireEvent.click(screen.getByRole("button", { name: "drafts" }));

    await waitFor(() => {
      expect(screen.getByText("My draft")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/drafts/publish/42"),
        {}
      );
    });
  });

  it("unauthenticated user sees login prompt", () => {
    render(<ProfilePage />);
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });
});

describe("Public profile page integration", () => {
  it("loads and displays another user's profile", async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        username: "otheruser",
        bio: "Other user bio",
        profile_picture_url: "https://example.com/pic.jpg",
        posts: [
          { id: 2, text: "Their post", username: "otheruser", likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000, post_metadata: {}, image_url: null, video_url: null, audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 },
        ],
      },
    });

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/otheruser.*Profile/)).toBeInTheDocument();
      expect(screen.getByText("Other user bio")).toBeInTheDocument();
      expect(screen.getByText("Their post")).toBeInTheDocument();
    });
  });

  it("shows loading state before data arrives", () => {
    mockedApi.get.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<UserProfilePage />);
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("displays posts with media", async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        username: "otheruser",
        bio: null,
        profile_picture_url: null,
        posts: [
          { id: 3, text: "Video post", username: "otheruser", likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000, post_metadata: {}, image_url: null, video_url: "https://example.com/video.mp4", audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 },
          { id: 4, text: "Image post", username: "otheruser", likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000001, post_metadata: {}, image_url: "https://example.com/pic.jpg", video_url: null, audio_url: null, profile_picture_url: null, replies_count: 0, quotes_count: 0, slop_count: 0 },
        ],
      },
    });

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Video post")).toBeInTheDocument();
      expect(screen.getByText("Image post")).toBeInTheDocument();
    });
  });
});
