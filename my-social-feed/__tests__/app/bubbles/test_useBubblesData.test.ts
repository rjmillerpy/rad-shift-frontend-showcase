import { renderHook, act, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import { useBubblesData } from "@/app/bubbles/useBubblesData";
import type { TopicDef } from "@/app/bubbles/types";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const mockedApi = api as jest.Mocked<typeof api>;

const rawPost = (id: number, extra: Record<string, unknown> = {}) => ({
  id, text: `Post ${id}`, username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...extra,
});

const algo: TopicDef = { label: "Algo", color: "#007bff", isFeed: true, tab: "algo" };
const following: TopicDef = { label: "Following", color: "#6f42c1", isFeed: true, tab: "following" };
const tech: TopicDef = { label: "Technology", color: "#e74c3c" };

/** Route api.get by URL; unknown URLs reject so a wrong endpoint fails loudly. */
const routeGet = (routes: Record<string, unknown>) => {
  mockedApi.get.mockImplementation((url: string) =>
    url in routes ? Promise.resolve({ data: routes[url] }) : Promise.reject(new Error(`unexpected GET ${url}`)));
};

let errorSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

describe("useBubblesData — profile and settings", () => {
  it("fetches nothing without a token", () => {
    const { result } = renderHook(() => useBubblesData(null));
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      profilePic: null, bubbleSettings: { custom_topics: [], hidden_topics: [] },
      subcategories: [], posts: [], loadingPosts: false,
    });
  });

  it("loads the profile picture and bubble settings once a token arrives", async () => {
    routeGet({
      "/profile/me": { profile_picture_url: "/me.png" },
      "/profile/me/bubble-settings": { custom_topics: ["Knitting"], hidden_topics: ["Sports"] },
    });
    const { result, rerender } = renderHook(({ token }) => useBubblesData(token), {
      initialProps: { token: null as string | null },
    });
    rerender({ token: "tok" });
    await waitFor(() => expect(result.current.profilePic).toBe("/me.png"));
    await waitFor(() => expect(result.current.bubbleSettings)
      .toEqual({ custom_topics: ["Knitting"], hidden_topics: ["Sports"] }));
  });

  it("defaults missing settings lists to empty and keeps a null picture", async () => {
    routeGet({ "/profile/me": { profile_picture_url: null }, "/profile/me/bubble-settings": {} });
    const { result } = renderHook(() => useBubblesData("tok"));
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(result.current.profilePic).toBeNull();
    expect(result.current.bubbleSettings).toEqual({ custom_topics: [], hidden_topics: [] });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs and keeps defaults when both requests fail", async () => {
    mockedApi.get.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useBubblesData("tok"));
    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(2));
    expect(result.current.profilePic).toBeNull();
    expect(result.current.bubbleSettings).toEqual({ custom_topics: [], hidden_topics: [] });
  });
});

describe("useBubblesData — fetchSubcategories", () => {
  it("asks the tags endpoint for a feed topic, drops the topic itself and keeps at most 4", async () => {
    routeGet({ "/posts/tags": { tags: ["ALGO", "rust", "ai", "music", "art", "film"] } });
    const { result } = renderHook(() => useBubblesData(null));
    await act(async () => { await result.current.fetchSubcategories(algo); });
    expect(mockedApi.get).toHaveBeenCalledWith("/posts/tags", { params: { feed: "algo", limit: 8 } });
    expect(result.current.subcategories).toEqual(["rust", "ai", "music", "art"]);
  });

  it("collects unique co-tags from search results for a general topic (string and array shapes)", async () => {
    routeGet({
      "/posts/search/posts": {
        posts: [
          rawPost(1, { post_metadata: { tags: "technology| rust |ai||" } }),
          rawPost(2, { post_metadata: { tags: ["rust", " TECHNOLOGY ", "linux ", 7, ""] } }),
          rawPost(3, { post_metadata: {} }),
          rawPost(4),
        ],
      },
    });
    const { result } = renderHook(() => useBubblesData(null));
    await act(async () => { await result.current.fetchSubcategories(tech); });
    expect(mockedApi.get).toHaveBeenCalledWith("/posts/search/posts", { params: { q: "Technology", limit: 50 } });
    expect(result.current.subcategories).toEqual(["rust", "ai", "linux"]);
  });

  it.each([
    ["feed topic with no tags field", algo, {}],
    ["general topic with no posts field", tech, {}],
  ])("yields no subcategories for a %s", async (_name, topic, data) => {
    routeGet({ "/posts/tags": data, "/posts/search/posts": data });
    const { result } = renderHook(() => useBubblesData(null));
    act(() => { result.current.setSubcategories(["stale"]); });
    await act(async () => { await result.current.fetchSubcategories(topic); });
    expect(result.current.subcategories).toEqual([]);
  });

  it("clears subcategories and logs when the request fails", async () => {
    mockedApi.get.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useBubblesData(null));
    act(() => { result.current.setSubcategories(["stale"]); });
    await act(async () => { await result.current.fetchSubcategories(tech); });
    expect(result.current.subcategories).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith("Error fetching subcategories:", expect.any(Error));
  });
});

describe("useBubblesData — fetchTopicPosts", () => {
  it.each([
    ["algo feed", algo, 0, "/posts/algo", { offset: 0, limit: 15 }],
    ["following feed", following, 15, "/posts/following", { offset: 15, limit: 15 }],
    ["general topic", tech, 30, "/posts/search/posts", { offset: 30, limit: 15, q: "Technology" }],
  ])("requests the %s from the right endpoint", async (_name, topic, offset, url, params) => {
    routeGet({ [url]: { posts: [] } });
    const { result } = renderHook(() => useBubblesData(null));
    await act(async () => { await result.current.fetchTopicPosts(topic, offset); });
    expect(mockedApi.get).toHaveBeenCalledWith(url, { params });
  });

  it("replaces posts at offset 0, appends at later offsets, and normalises flags", async () => {
    const { result } = renderHook(() => useBubblesData(null));
    routeGet({ "/posts/algo": { posts: [rawPost(1, { is_saved_by_me: true }), rawPost(2, { is_me: true })] } });
    await act(async () => { await result.current.fetchTopicPosts(algo, 0); });
    expect(result.current.posts.map((p) => [p.id, p.saved_by_me, p.is_me])).toEqual([
      [1, true, false],
      [2, false, true],
    ]);

    routeGet({ "/posts/algo": { posts: [rawPost(3)] } });
    await act(async () => { await result.current.fetchTopicPosts(algo, 15); });
    expect(result.current.posts.map((p) => p.id)).toEqual([1, 2, 3]);

    routeGet({ "/posts/algo": {} });
    await act(async () => { await result.current.fetchTopicPosts(algo, 0); });
    expect(result.current.posts).toEqual([]);
  });

  it("is loading while the request is in flight", async () => {
    let resolve: (value: { data: unknown }) => void = () => {};
    mockedApi.get.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useBubblesData(null));
    act(() => { void result.current.fetchTopicPosts(algo, 0); });
    expect(result.current.loadingPosts).toBe(true);
    await act(async () => { resolve({ data: { posts: [rawPost(1)] } }); });
    expect(result.current.loadingPosts).toBe(false);
    expect(result.current.posts).toHaveLength(1);
  });

  it("keeps existing posts, logs and stops loading when the request fails", async () => {
    const { result } = renderHook(() => useBubblesData(null));
    routeGet({ "/posts/algo": { posts: [rawPost(1)] } });
    await act(async () => { await result.current.fetchTopicPosts(algo, 0); });
    mockedApi.get.mockRejectedValue(new Error("boom"));
    await act(async () => { await result.current.fetchTopicPosts(algo, 15); });
    expect(result.current.posts.map((p) => p.id)).toEqual([1]);
    expect(result.current.loadingPosts).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("Error fetching posts:", expect.any(Error));
  });

  it("resetPostState clears posts and subcategories", async () => {
    routeGet({ "/posts/algo": { posts: [rawPost(1)] } });
    const { result } = renderHook(() => useBubblesData(null));
    await act(async () => { await result.current.fetchTopicPosts(algo, 0); });
    act(() => { result.current.setSubcategories(["rust"]); });
    act(() => { result.current.resetPostState(); });
    expect(result.current.posts).toEqual([]);
    expect(result.current.subcategories).toEqual([]);
  });
});
