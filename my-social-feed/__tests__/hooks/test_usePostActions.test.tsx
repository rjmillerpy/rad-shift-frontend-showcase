import React from "react";
import { renderHook, act } from "@testing-library/react";
import api from "@/lib/api";
import { usePostActions } from "@/hooks/usePostActions";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const makePost = (id: number, overrides: Partial<Post> = {}): Post => ({
  id, text: `Post ${id}`, username: `user${id}`, likes: 0, reposts: 0,
  shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  post_metadata: {}, profile_picture_url: null, image_url: null,
  video_url: null, audio_url: null, liked_by_me: false,
  laughed_by_me: false, saved_by_me: false, replies_count: 0,
  quotes_count: 0, slop_count: 0, ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("usePostActions", () => {
  const setup = () => {
    let posts = [makePost(1), makePost(2)];
    const setPosts = jest.fn((fn: (prev: Post[]) => Post[]) => {
      posts = fn(posts);
    });
    const { result } = renderHook(() => usePostActions(setPosts));
    return { result, setPosts, getPosts: () => posts };
  };

  describe("toggleLike", () => {
    it("calls the like API and updates post state", async () => {
      mockedApi.post.mockResolvedValue({ data: { likes: 1, action: "liked" } });
      const { result, getPosts } = setup();

      await act(async () => { await result.current.toggleLike(1); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/like/1");
      expect(getPosts()[0].likes).toBe(1);
      expect(getPosts()[0].liked_by_me).toBe(true);
    });

    it("sets liked_by_me to false on unlike", async () => {
      mockedApi.post.mockResolvedValue({ data: { likes: 0, action: "unliked" } });
      const { result, getPosts } = setup();

      await act(async () => { await result.current.toggleLike(1); });

      expect(getPosts()[0].liked_by_me).toBe(false);
    });

    it("does not crash on API error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockedApi.post.mockRejectedValue(new Error("Network error"));
      const { result } = setup();

      await act(async () => { await result.current.toggleLike(1); });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("toggleLaugh", () => {
    it("calls the laugh API and updates state", async () => {
      mockedApi.post.mockResolvedValue({ data: { laughs: 1, action: "laughed" } });
      const { result, getPosts } = setup();

      await act(async () => { await result.current.toggleLaugh(1); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/laugh/1");
      expect(getPosts()[0].laughs).toBe(1);
      expect(getPosts()[0].laughed_by_me).toBe(true);
    });
  });

  describe("toggleRepost", () => {
    it("calls the repost API and updates state", async () => {
      mockedApi.post.mockResolvedValue({ data: { reposts: 1, action: "re-posted" } });
      const { result, getPosts } = setup();

      await act(async () => { await result.current.toggleRepost(1); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/repost/1");
      expect(getPosts()[0].reposts).toBe(1);
      expect(getPosts()[0].reposted_by_me).toBe(true);
    });
  });

  describe("toggleSave", () => {
    it("calls save API, returns true when saved", async () => {
      mockedApi.post.mockResolvedValue({ data: { saves: 1, action: "saved" } });
      const { result, getPosts } = setup();

      let saved: boolean = false;
      await act(async () => { saved = await result.current.toggleSave(1); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/save/1");
      expect(saved).toBe(true);
      expect(getPosts()[0].saved_by_me).toBe(true);
    });

    it("returns false when unsaved", async () => {
      mockedApi.post.mockResolvedValue({ data: { saves: 0, action: "unsaved" } });
      const { result } = setup();

      let saved: boolean = true;
      await act(async () => { saved = await result.current.toggleSave(1); });

      expect(saved).toBe(false);
    });

    it("returns false on error", async () => {
      jest.spyOn(console, "error").mockImplementation();
      mockedApi.post.mockRejectedValue(new Error("fail"));
      const { result } = setup();

      let saved: boolean = true;
      await act(async () => { saved = await result.current.toggleSave(1); });

      expect(saved).toBe(false);
      (console.error as jest.Mock).mockRestore();
    });
  });

  describe("sharePost", () => {
    it("calls share API and returns share URL", async () => {
      mockedApi.post.mockResolvedValue({ data: { shares: 1, share_url: "/post/1" } });
      const { result, getPosts } = setup();

      let url: string | null = null;
      await act(async () => { url = await result.current.sharePost(1); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/share/1");
      expect(url).toBe("/post/1");
      expect(getPosts()[0].shares).toBe(1);
    });

    it("returns null on error", async () => {
      jest.spyOn(console, "error").mockImplementation();
      mockedApi.post.mockRejectedValue(new Error("fail"));
      const { result } = setup();

      let url: string | null = "before";
      await act(async () => { url = await result.current.sharePost(1); });

      expect(url).toBeNull();
      (console.error as jest.Mock).mockRestore();
    });
  });

  describe("reportSlop", () => {
    it("calls slop API with reason", async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      const { result } = setup();

      await act(async () => { await result.current.reportSlop(1, "AI generated"); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/slop/1", { reason: "AI generated" });
    });
  });

  describe("reportPost", () => {
    it("calls report API and removes post from list", async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      const { result, getPosts } = setup();

      expect(getPosts()).toHaveLength(2);
      await act(async () => { await result.current.reportPost(1); });

      expect(mockedApi.post).toHaveBeenCalledWith("/posts/report/1");
      expect(getPosts()).toHaveLength(1);
      expect(getPosts()[0].id).toBe(2);
    });
  });

  describe("only updates the targeted post", () => {
    it("does not modify other posts when liking", async () => {
      mockedApi.post.mockResolvedValue({ data: { likes: 5, action: "liked" } });
      const { result, getPosts } = setup();

      await act(async () => { await result.current.toggleLike(1); });

      expect(getPosts()[0].likes).toBe(5);
      expect(getPosts()[1].likes).toBe(0); // post 2 unchanged
    });
  });
});
