import { renderHook, act } from "@testing-library/react";
import api from "@/lib/api";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

const mockedApi = api as jest.Mocked<typeof api>;
const post = (id: number, username = "bob"): Post => ({ id, username, is_followed_by_me: false } as unknown as Post);

/** The hook against a real posts array, as a page would hold it. */
function setup(options?: Parameters<typeof usePostInteractions>[1], loggedIn = true) {
  if (loggedIn) localStorage.setItem("token", "t");
  else localStorage.removeItem("token");
  let posts: Post[] = [post(1), post(2, "alice")];
  const setPosts = jest.fn((fn: (prev: Post[]) => Post[]) => { posts = fn(posts); });
  const { result } = renderHook(() => usePostInteractions(setPosts, options));
  return { result, posts: () => posts };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.post.mockResolvedValue({ data: {} });
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

describe("usePostInteractions", () => {
  describe("follow", () => {
    it.each([
      [false, "/follow/bob"],
      [true, "/follow/un/bob"],
    ])("isFollowed=%s calls %s, the routes the API has", async (isFollowed, url) => {
      const { result } = setup();
      await act(() => result.current.onFollowToggle("bob", isFollowed));
      expect(mockedApi.post).toHaveBeenCalledWith(url, {});
    });

    it("flips the follow state on that user's posts only", async () => {
      const { result, posts } = setup();
      await act(() => result.current.onFollowToggle("bob", false));
      expect(posts().map((p) => p.is_followed_by_me)).toEqual([true, false]);
    });

    it("logs a failure and leaves the posts alone", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      mockedApi.post.mockRejectedValue(new Error("down"));
      const { result, posts } = setup();
      await act(() => result.current.onFollowToggle("bob", false));
      expect(consoleError).toHaveBeenCalledWith("Toggling follow failed:", expect.any(Error));
      expect(posts()[0].is_followed_by_me).toBe(false);
      consoleError.mockRestore();
    });
  });

  describe("slop and report", () => {
    it("marking slop sends the reason and drops the post", async () => {
      const { result, posts } = setup();
      await act(() => result.current.onMarkSlop(1, "AI"));
      expect(mockedApi.post).toHaveBeenCalledWith("/posts/slop/1", { reason: "AI" });
      expect(posts().map((p) => p.id)).toEqual([2]);
    });

    it("reporting prefixes the reason, drops the post and confirms", async () => {
      const { result, posts } = setup();
      await act(() => result.current.onReport(2, "Spam"));
      expect(mockedApi.post).toHaveBeenCalledWith("/posts/slop/2", { reason: "[REPORT] Spam" });
      expect(posts().map((p) => p.id)).toEqual([1]);
      expect(window.alert).toHaveBeenCalledWith("Report submitted. This post will no longer appear in your feed.");
    });

    it("says so when it fails, and keeps the post", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockedApi.post.mockRejectedValue(new Error("down"));
      const { result, posts } = setup();
      await act(() => result.current.onMarkSlop(1, "AI"));
      expect(window.alert).toHaveBeenCalledWith("Failed to mark as slop.");
      expect(posts()).toHaveLength(2);
    });

    it("does nothing when logged out", async () => {
      const { result } = setup(undefined, false);
      await act(() => result.current.onMarkSlop(1, "AI"));
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it("hands removal to onRemoved when given", async () => {
      const onRemoved = jest.fn();
      const { result, posts } = setup({ onRemoved });
      await act(() => result.current.onMarkSlop(1, "AI"));
      expect(onRemoved).toHaveBeenCalledWith(1);
      expect(posts()).toHaveLength(2);
    });
  });

  describe("share", () => {
    it("copies the share URL the API returns", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      mockedApi.post.mockResolvedValue({ data: { share_url: "/s/abc", shares: 3 } });
      const { result } = setup();
      await act(() => result.current.onShare(1));
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/s/abc`);
      expect(window.alert).toHaveBeenCalledWith("Post link copied!");
    });

    it("falls back to the post's page when the API gives no share URL", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      mockedApi.post.mockResolvedValue({ data: {} });
      const { result } = setup();
      await act(() => result.current.onShare(7));
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/post/7`);
    });
  });

  describe("quote", () => {
    it("opens the post page's quote composer by default", () => {
      const { result } = setup();
      result.current.onQuote(5);
      expect(mockPush).toHaveBeenCalledWith("/post/5?quote=1");
    });

    it("uses onQuote when given", () => {
      const onQuote = jest.fn();
      const { result } = setup({ onQuote });
      result.current.onQuote(5);
      expect(onQuote).toHaveBeenCalledWith(5);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
