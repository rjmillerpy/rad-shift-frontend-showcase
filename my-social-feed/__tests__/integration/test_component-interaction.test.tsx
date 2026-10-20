/**
 * Integration test: component interaction patterns.
 *
 * Tests how PostCard, PostActions, PostComposer, and ReplyThread
 * work together as a system.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({}),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import ReplyThread from "@/components/ReplyThread";
import type { Post } from "@/types/post";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const basePost: Post = {
  id: 1,
  text: "Test post content",
  username: "testuser",
  profile_picture_url: null,
  image_url: null,
  video_url: null,
  audio_url: null,
  post_metadata: { tags: ["test", "integration"], location: "SF" },
  liked_by_me: false,
  reposted_by_me: false,
  is_followed_by_me: false,
  is_me: false,
  likes: 5,
  laughs: 0,
  reposts: 3,
  shares: 2,
  saves: 1,
  replies_count: 4,
  quotes_count: 2,
  slop_count: 0,
  saved_by_me: false,
  unix_timestamp: 1700000000,
  parent_post_id: null,
  quoted_post: null,
};

const mockHandlers = {
  onToggleLike: jest.fn(), onToggleLaugh: jest.fn(),
  onRepost: jest.fn(),
  onShare: jest.fn(),
  onToggleSave: jest.fn().mockResolvedValue(true),
  onMarkSlop: jest.fn(),
  onReport: jest.fn(),
  onQuote: jest.fn(),
  onFollowToggle: jest.fn(),
  onToggleReplies: jest.fn(),
  onFetchReplies: jest.fn().mockResolvedValue(undefined),
};

describe("PostCard + PostActions interaction", () => {
  it("renders post with all counts visible in actions", () => {
    render(
      <PostCard
        post={basePost}
        index={0}
        token="test-token"
        openReplies={{}}
        repliesByPost={{}}
        {...mockHandlers}
      />
    );

    expect(screen.getByText("Test post content")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();

    // Click "Show interactions" to reveal PostActions with counts
    fireEvent.click(screen.getByText("Show interactions"));
    expect(screen.getByText("5")).toBeInTheDocument(); // likes
    expect(screen.getByText("3")).toBeInTheDocument(); // reposts
    expect(screen.getByText("4")).toBeInTheDocument(); // replies
  });

  it("clicking like on PostCard propagates to parent handler", () => {
    render(
      <PostCard post={basePost} index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    fireEvent.click(screen.getByText("Show interactions"));
    fireEvent.click(screen.getByTitle("Like"));
    expect(mockHandlers.onToggleLike).toHaveBeenCalledWith(1);
  });

  it("metadata tag button toggles metadata display", () => {
    render(
      <PostCard post={basePost} index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    expect(screen.queryByText("Tags:")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Show interactions"));
    fireEvent.click(screen.getByTitle("Toggle metadata"));
    expect(screen.getByText("Tags:")).toBeInTheDocument();
    expect(screen.getByText("test, integration")).toBeInTheDocument();
    expect(screen.getByText("SF")).toBeInTheDocument();
  });

  it("does not show tag button when metadata is empty", () => {
    render(
      <PostCard post={{ ...basePost, post_metadata: {} }} index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );
    fireEvent.click(screen.getByText("Show interactions"));
    expect(screen.queryByTitle("Toggle metadata")).not.toBeInTheDocument();
  });

  it("shows follow button for non-own posts", () => {
    render(
      <PostCard post={{ ...basePost, is_me: false, is_followed_by_me: false }} index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );

    fireEvent.click(screen.getByTitle("Follow"));
    expect(mockHandlers.onFollowToggle).toHaveBeenCalledWith("testuser", false);
  });

  it("hides follow button for own posts", () => {
    render(
      <PostCard post={{ ...basePost, is_me: true }} index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers} />
    );
    expect(screen.queryByTitle("Follow")).not.toBeInTheDocument();
  });

  it("renders quoted post with link to detail page", () => {
    render(
      <PostCard
        post={{ ...basePost, quoted_post: { id: 99, username: "quoted_user", text: "Original text" } }}
        index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers}
      />
    );
    expect(screen.getByText(/Quoting @quoted_user/)).toBeInTheDocument();
    expect(screen.getByText(/Original text/)).toBeInTheDocument();

    // Quoted post should link to its detail page
    const quoteLink = screen.getByText(/Quoting @quoted_user/).closest("a");
    expect(quoteLink).toHaveAttribute("href", "/post/99");
  });

  it("renders media elements", () => {
    const { container } = render(
      <PostCard
        post={{ ...basePost, image_url: "https://example.com/img.jpg", video_url: "https://example.com/vid.mp4", audio_url: "https://example.com/aud.mp3" }}
        index={0} token="test-token"
        openReplies={{}} repliesByPost={{}} {...mockHandlers}
      />
    );
    expect(container.querySelector("video")).toBeInTheDocument();
    expect(container.querySelector("audio")).toBeInTheDocument();
  });
});

describe("PostComposer interaction", () => {
  it("submits post and clears form", async () => {
    mockedApi.post.mockResolvedValue({ data: { message: "Post created", image_url: null, video_url: null, audio_url: null } });
    const onPostCreated = jest.fn();

    render(
      <PostComposer token="test-token" quotePreview={null} onClearQuote={jest.fn()}
        onPostCreated={onPostCreated} quotePostId={null} />
    );

    await userEvent.type(screen.getByPlaceholderText("Write a post..."), "New content");
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(onPostCreated).toHaveBeenCalled();
      expect(screen.getByPlaceholderText("Write a post...")).toHaveValue("");
    });
  });

  it("shows and clears quote preview", () => {
    const onClearQuote = jest.fn();
    render(
      <PostComposer token="test-token" quotePreview={{ ...basePost, text: "Quoted" }}
        onClearQuote={onClearQuote} onPostCreated={jest.fn()} quotePostId={1} />
    );
    expect(screen.getByText(/Quoting @testuser/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear quote"));
    expect(onClearQuote).toHaveBeenCalled();
  });

  it("saves draft with alert", async () => {
    mockedApi.post.mockResolvedValue({ data: { message: "Draft saved", image_url: null, video_url: null, audio_url: null } });

    render(
      <PostComposer token="test-token" quotePreview={null} onClearQuote={jest.fn()}
        onPostCreated={jest.fn()} quotePostId={null} />
    );

    await userEvent.type(screen.getByPlaceholderText("Write a post..."), "Draft text");
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Draft saved");
    });
  });

  it("toggles metadata fields", async () => {
    render(
      <PostComposer token="test-token" quotePreview={null} onClearQuote={jest.fn()}
        onPostCreated={jest.fn()} quotePostId={null} />
    );

    expect(screen.queryByPlaceholderText("Tags (pipe-separated)")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Toggle Metadata"));
    expect(screen.getByPlaceholderText("Tags (pipe-separated)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tag users (comma-separated usernames)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Location")).toBeInTheDocument();
  });
});

describe("ReplyThread interaction", () => {
  it("renders replies and sends new reply", async () => {
    const replies: Post[] = [
      { ...basePost, id: 10, text: "First reply", username: "replier1" },
      { ...basePost, id: 11, text: "Second reply", username: "replier2" },
    ];
    mockedApi.post.mockResolvedValue({ data: { message: "Post created" } });
    const onFetchReplies = jest.fn().mockResolvedValue(undefined);

    render(
      <ReplyThread parentId={1} token="test-token"
        openReplies={{ 1: true }} repliesByPost={{ 1: replies }}
        onToggleReplies={jest.fn()} onFetchReplies={onFetchReplies}
        onToggleLike={jest.fn()} onToggleLaugh={jest.fn()} onRepost={jest.fn()} onShare={jest.fn()}
        onToggleSave={jest.fn().mockResolvedValue(true)} onMarkSlop={jest.fn()} onQuote={jest.fn()} onReport={jest.fn()} />
    );

    expect(screen.getByText("First reply")).toBeInTheDocument();
    expect(screen.getByText("Second reply")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Write a reply..."), "My reply");
    const replyButtons = screen.getAllByRole("button", { name: "Reply" });
    fireEvent.click(replyButtons[replyButtons.length - 1]);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
      expect(onFetchReplies).toHaveBeenCalledWith(1);
    });
  });

  it("shows empty state and hides when closed", () => {
    const { rerender } = render(
      <ReplyThread parentId={1} token="test-token"
        openReplies={{ 1: true }} repliesByPost={{ 1: [] }}
        onToggleReplies={jest.fn()} onFetchReplies={jest.fn().mockResolvedValue(undefined)}
        onToggleLike={jest.fn()} onToggleLaugh={jest.fn()} onRepost={jest.fn()} onShare={jest.fn()}
        onToggleSave={jest.fn().mockResolvedValue(true)} onMarkSlop={jest.fn()} onQuote={jest.fn()} onReport={jest.fn()} />
    );
    expect(screen.getByText("No replies yet.")).toBeInTheDocument();

    rerender(
      <ReplyThread parentId={1} token="test-token"
        openReplies={{ 1: false }} repliesByPost={{ 1: [{ ...basePost, id: 10, text: "Hidden" }] }}
        onToggleReplies={jest.fn()} onFetchReplies={jest.fn().mockResolvedValue(undefined)}
        onToggleLike={jest.fn()} onToggleLaugh={jest.fn()} onRepost={jest.fn()} onShare={jest.fn()}
        onToggleSave={jest.fn().mockResolvedValue(true)} onMarkSlop={jest.fn()} onQuote={jest.fn()} onReport={jest.fn()} />
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
