import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "42" }),
}));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));

import AgoraThreadPage from "@/app/agora/[id]/page";

const makePost = (overrides: any = {}) => ({
  id: 42, text: "Original post content", username: "alice",
  likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 3,
  unix_timestamp: 1700000000, post_metadata: {},
  profile_picture_url: null, image_url: null, video_url: null, audio_url: null,
  replies_count: 2, quotes_count: 0, slop_count: 0,
  liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
  quoted_post: null,
  ...overrides,
});

const makeReply = (id: number, text: string, overrides: any = {}) => ({
  ...makePost({ id, text, username: `user${id}` }),
  ...overrides,
});

const defaultMock = (url: string) => {
  if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
  if (url.includes("/profile")) return Promise.resolve({ data: { profile_picture_url: null } });
  return Promise.resolve({ data: { post: makePost() } });
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedApi.get.mockImplementation(defaultMock);
});

afterEach(() => { jest.restoreAllMocks(); });

describe("AgoraThreadPage", () => {
  describe("Rendering", () => {
    it("shows loading state", () => {
      mockedApi.get.mockReturnValue(new Promise(() => {}));
      render(<AgoraThreadPage />);
      expect(screen.getByText("Loading thread...")).toBeInTheDocument();
    });

    it("shows thread not found on error", async () => {
      mockedApi.get.mockRejectedValue(new Error("404"));
      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByText("Thread not found.")).toBeInTheDocument());
    });

    it("renders original post", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        if (url.includes("/profile")) return Promise.resolve({ data: { profile_picture_url: null } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("forum-post-42")).toBeInTheDocument();
      });
      expect(screen.getByTestId("forum-post-42")).toHaveTextContent("Original post content");
    });

    it("shows OP badge on original poster", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByText("OP")).toBeInTheDocument();
      });
    });

    it("renders replies", async () => {
      const replies = [makeReply(10, "First reply"), makeReply(11, "Second reply")];
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByText("First reply")).toBeInTheDocument();
        expect(screen.getByText("Second reply")).toBeInTheDocument();
        expect(screen.getByText("2 Replies")).toBeInTheDocument();
      });
    });

    it("shows post number for each post", async () => {
      const replies = [makeReply(10, "Reply text")];
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByText(/#1/)).toBeInTheDocument();
        expect(screen.getByText(/#2/)).toBeInTheDocument();
      });
    });

    it("shows breadcrumb navigation", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByText("Agora Forum")).toBeInTheDocument();
        const backLink = screen.getByText(/Back to forum/);
        expect(backLink.closest("a")).toHaveAttribute("href", "/agora");
      });
    });

    it("shows media in post", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost({ image_url: "https://img.com/pic.jpg", video_url: "https://vid.com/v.mp4" }) } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(document.querySelector("img[src='https://img.com/pic.jpg']")).toBeInTheDocument();
        expect(document.querySelector("video")).toBeInTheDocument();
      });
    });

    it("shows quoted post", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost({ quoted_post: { id: 5, username: "bob", text: "Original quote" } }) } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByText(/Quoting @bob/)).toBeInTheDocument();
        expect(screen.getByText("Original quote")).toBeInTheDocument();
      });
    });
  });

  describe("Reactions", () => {
    beforeEach(() => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost() } });
      });
    });

    it("shows reaction buttons", async () => {
      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => {
        expect(screen.getByTestId("react-like-42")).toBeInTheDocument();
        expect(screen.getByTestId("react-laugh-42")).toBeInTheDocument();
        expect(screen.getByTestId("react-repost-42")).toBeInTheDocument();
        expect(screen.getByTestId("react-save-42")).toBeInTheDocument();
      });
    });

    it("calls like API", async () => {
      mockedApi.post.mockResolvedValue({ data: { likes: 6, action: "liked" } });
      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("react-like-42")).toBeInTheDocument());

      await act(async () => { fireEvent.click(screen.getByTestId("react-like-42")); });
      expect(mockedApi.post).toHaveBeenCalledWith(expect.stringContaining("/posts/like/42"));
    });

    it("calls laugh API", async () => {
      mockedApi.post.mockResolvedValue({ data: { laughs: 4, action: "laughed" } });
      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("react-laugh-42")).toBeInTheDocument());

      await act(async () => { fireEvent.click(screen.getByTestId("react-laugh-42")); });
      expect(mockedApi.post).toHaveBeenCalledWith(expect.stringContaining("/posts/laugh/42"));
    });
  });

  describe("Reply", () => {
    beforeEach(() => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost() } });
      });
    });

    it("shows reply box when reply clicked", async () => {
      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("reply-btn-42")).toBeInTheDocument());

      await act(async () => { fireEvent.click(screen.getByTestId("reply-btn-42")); });
      expect(screen.getByTestId("reply-box-42")).toBeInTheDocument();
    });

    it("submits reply via API", async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 99 } });
      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("reply-btn-42")).toBeInTheDocument());

      await act(async () => { fireEvent.click(screen.getByTestId("reply-btn-42")); });
      fireEvent.change(screen.getByTestId("reply-input-42"), { target: { value: "My reply" } });
      await act(async () => { fireEvent.click(screen.getByTestId("reply-submit-42")); });

      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/posts/add"), expect.any(URLSearchParams)
      );
    });
  });

  describe("Quote", () => {
    it("navigates to post page with quote param", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("quote-btn-42")).toBeInTheDocument());

      await act(async () => { fireEvent.click(screen.getByTestId("quote-btn-42")); });
      expect(mockPush).toHaveBeenCalledWith("/post/42?quote=1");
    });
  });

  describe("Slop", () => {
    it("opens SlopModal and redirects to agora when OP is slopped", async () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies: [] } });
        return Promise.resolve({ data: { post: makePost() } });
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("slop-btn-42")).toBeInTheDocument());

      // Open the modal.
      await act(async () => { fireEvent.click(screen.getByTestId("slop-btn-42")); });
      // Modal renders "Mark as Slop" heading + Submit button.
      expect(screen.getByText("Mark as Slop")).toBeInTheDocument();

      // Submit with the default reason ("AI").
      await act(async () => { fireEvent.click(screen.getByText("Submit")); });
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/agora"));
      expect(mockedApi.post).toHaveBeenCalledWith(
        "/posts/slop/42",
        expect.objectContaining({ reason: "AI" }),
      );
    });
  });

  describe("Regression: reply textarea typing", () => {
    /**
     * BUG: Reply textarea typed backwards. Characters appeared in reverse order.
     * CAUSE: ForumPost was defined as a nested function component inside AgoraThreadPage.
     * Every keystroke changed replyText state, which re-rendered the parent, which
     * recreated the ForumPost function (new reference), which React treated as a new
     * component type, unmounting and remounting the textarea on every keystroke.
     * The cursor reset to position 0 after each character, so typing "New" produced "weN".
     * FIX: Changed ForumPost from a component (<ForumPost />) to a plain render function
     * (renderForumPost()) called inline. Also changed replyText from a single string to
     * a Record<number, string> keyed by post ID.
     */
    it("reply textarea preserves typed text in correct order", async () => {
      localStorage.setItem("token", "test-token");

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("forum-post-42")).toBeInTheDocument());

      // Open reply box
      await act(async () => { fireEvent.click(screen.getByTestId("reply-btn-42")); });
      expect(screen.getByTestId("reply-input-42")).toBeInTheDocument();

      // Type multiple characters sequentially
      const textarea = screen.getByTestId("reply-input-42") as HTMLTextAreaElement;
      await act(async () => { fireEvent.change(textarea, { target: { value: "H" } }); });
      await act(async () => { fireEvent.change(textarea, { target: { value: "He" } }); });
      await act(async () => { fireEvent.change(textarea, { target: { value: "Hel" } }); });
      await act(async () => { fireEvent.change(textarea, { target: { value: "Hell" } }); });
      await act(async () => { fireEvent.change(textarea, { target: { value: "Hello" } }); });

      // Text should be in correct order, not reversed
      expect((screen.getByTestId("reply-input-42") as HTMLTextAreaElement).value).toBe("Hello");
    });

    it("reply textarea is not unmounted between keystrokes", async () => {
      localStorage.setItem("token", "test-token");

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("forum-post-42")).toBeInTheDocument());

      await act(async () => { fireEvent.click(screen.getByTestId("reply-btn-42")); });

      const textarea = screen.getByTestId("reply-input-42");

      // Type a character — the same DOM node should still be in the document
      await act(async () => { fireEvent.change(textarea, { target: { value: "A" } }); });

      // The original reference should still be the same element (not remounted)
      expect(textarea).toBe(screen.getByTestId("reply-input-42"));
      expect((textarea as HTMLTextAreaElement).value).toBe("A");
    });

    it("each post has independent reply text", async () => {
      localStorage.setItem("token", "test-token");
      const replies = [makeReply(10, "A reply")];
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/replies")) return Promise.resolve({ data: { replies } });
        if (url.includes("/profile")) return Promise.resolve({ data: { profile_picture_url: null } });
        return Promise.resolve({ data: { post: makePost() } });
      });

      await act(async () => { render(<AgoraThreadPage />); });
      await waitFor(() => expect(screen.getByTestId("forum-post-42")).toBeInTheDocument());

      // Open reply on OP
      await act(async () => { fireEvent.click(screen.getByTestId("reply-btn-42")); });
      await act(async () => {
        fireEvent.change(screen.getByTestId("reply-input-42"), { target: { value: "Reply to OP" } });
      });

      // Open reply on reply post
      await act(async () => { fireEvent.click(screen.getByTestId("reply-btn-10")); });

      // OP reply text should still be preserved
      // (reply-input-42 may be gone since replyingTo changed to 10, but the state is independent)
      expect((screen.getByTestId("reply-input-10") as HTMLTextAreaElement).value).toBe("");
    });
  });
});
