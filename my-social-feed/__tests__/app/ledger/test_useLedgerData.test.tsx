import { renderHook, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";
import {
  applyClientFilters,
  buildLedgerRow,
  classifyMedia,
  formatRelativeTime,
  truncateForCell,
  useLedgerData,
} from "@/app/ledger/useLedgerData";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));
const mockedApi = api as jest.Mocked<typeof api>;

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1, text: "hello", username: "alice",
    profile_picture_url: null, image_url: null, image_urls: [], video_url: null, audio_url: null,
    document_urls: [], likes: 0, laughs: 0, shares: 0, reposts: 0, saves: 0,
    liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
    is_followed_by_me: false, is_me: false, unix_timestamp: 1_700_000_000,
    replies_count: 0, quotes_count: 0, slop_count: 0,
    reposted_by: null, quoted_post: null, media_metadata: null, post_metadata: {},
    ...overrides,
  } as Post;
}

describe("classifyMedia", () => {
  it.each<[string, Partial<Post>, ReturnType<typeof classifyMedia>]>([
    ["video wins", { video_url: "v.mp4", image_url: "i.jpg" }, "video"],
    ["image over audio", { image_url: "i.jpg", audio_url: "a.mp3" }, "image"],
    ["audio if only audio", { audio_url: "a.mp3" }, "audio"],
    ["text when nothing attached", {}, "text"],
  ])("%s", (_name, overrides, expected) => {
    expect(classifyMedia(makePost(overrides))).toBe(expected);
  });
});

describe("formatRelativeTime", () => {
  it("shows 'just now' for recent timestamps", () => {
    expect(formatRelativeTime(Math.floor(Date.now() / 1000) - 5)).toBe("just now");
  });

  it("uses hours for older", () => {
    const t = Math.floor(Date.now() / 1000) - 3600 * 2;
    expect(formatRelativeTime(t)).toBe("2h ago");
  });

  it("uses days after 24h", () => {
    const t = Math.floor(Date.now() / 1000) - 86400 * 3;
    expect(formatRelativeTime(t)).toBe("3d ago");
  });
});

describe("truncateForCell", () => {
  it.each([
    ["short string unchanged", "hello", 10, "hello"],
    ["long string ellipsized", "abcdefghij", 5, "abcde…"],
    ["exact boundary unchanged", "abcde", 5, "abcde"],
  ])("%s", (_name, s, max, expected) => {
    expect(truncateForCell(s, max)).toBe(expected);
  });
});

describe("buildLedgerRow", () => {
  it("produces displayable fields", () => {
    const row = buildLedgerRow(makePost({ username: "alice", text: "hi", likes: 5, image_url: "x.jpg" }));
    expect(row.displayName).toBe("alice");
    expect(row.displayText).toBe("hi");
    expect(row.displayLikes).toBe(5);
    expect(row.mediaKind).toBe("image");
  });

  it("sanitizes profanity in username and text so the row is SFW", () => {
    const row = buildLedgerRow(makePost({ username: "alice", text: "what the fuck happened" }));
    expect(row.rawText).not.toMatch(/fuck/i);
    expect(row.rawText).toMatch(/#/);
    expect(row.displayText).not.toMatch(/fuck/i);
  });
});

describe("applyClientFilters", () => {
  const posts: Post[] = [
    makePost({ id: 1, username: "alice", text: "cats" }),
    makePost({ id: 2, username: "bob", text: "dogs", image_url: "d.jpg" }),
    makePost({ id: 3, username: "carol", text: "meowing", video_url: "v.mp4" }),
  ];

  it("keeps everything when filter is 'all' and search is empty", () => {
    expect(applyClientFilters(posts, "all", "")).toHaveLength(3);
  });

  it("filters by media type", () => {
    expect(applyClientFilters(posts, "video", "").map((p) => p.id)).toEqual([3]);
  });

  it("searches on username substring", () => {
    expect(applyClientFilters(posts, "all", "ali").map((p) => p.id)).toEqual([1]);
  });

  it("searches on text substring", () => {
    expect(applyClientFilters(posts, "all", "meow").map((p) => p.id)).toEqual([3]);
  });

  it("combines type filter and search", () => {
    expect(applyClientFilters(posts, "image", "dog").map((p) => p.id)).toEqual([2]);
  });
});

describe("useLedgerData", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("fetches the algo sheet on mount", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [makePost({ id: 1, text: "hi", likes: 3 })] } });
    const { result } = renderHook(() =>
      useLedgerData({ sheet: "algo", sort: "recent", typeFilter: "all", search: "", token: "t" }),
    );
    await waitFor(() => expect(result.current.rows.length).toBe(1));
    expect(result.current.totalLikes).toBe(3);
  });

  it("returns empty rows for a sheet that requires auth when no token", async () => {
    const { result } = renderHook(() =>
      useLedgerData({ sheet: "drafts", sort: "recent", typeFilter: "all", search: "", token: null }),
    );
    await waitFor(() => expect(result.current.rows).toEqual([]));
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("swallows fetch errors gracefully with a logged catch", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedApi.get.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useLedgerData({ sheet: "algo", sort: "recent", typeFilter: "all", search: "", token: null }),
    );
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    expect(result.current.rows).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("re-fetches when refresh() is called", async () => {
    mockedApi.get.mockResolvedValue({ data: { posts: [] } });
    const { result } = renderHook(() =>
      useLedgerData({ sheet: "algo", sort: "recent", typeFilter: "all", search: "", token: "t" }),
    );
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    await act(async () => { await result.current.refresh(); });
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
  });

  it("caps visible rows to the initial page and exposes loadMore", async () => {
    // 40 posts → initial 25 visible, hasMore true, one loadMore reveals the rest
    const posts = Array.from({ length: 40 }, (_, i) => makePost({ id: i + 1, unix_timestamp: 1_700_000_000 - i }));
    mockedApi.get.mockResolvedValue({ data: { posts } });
    const { result } = renderHook(() =>
      useLedgerData({ sheet: "algo", sort: "recent", typeFilter: "all", search: "", token: "t" }),
    );
    await waitFor(() => expect(result.current.rows.length).toBe(25));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalAvailable).toBe(40);
    act(() => { result.current.loadMore(); });
    expect(result.current.rows.length).toBe(40);
    expect(result.current.hasMore).toBe(false);
  });

  it("resets pagination when the sheet changes", async () => {
    const posts = Array.from({ length: 40 }, (_, i) => makePost({ id: i + 1 }));
    mockedApi.get.mockResolvedValue({ data: { posts } });
    type Sheet = "algo" | "following";
    const { result, rerender } = renderHook(
      ({ sheet }: { sheet: Sheet }) =>
        useLedgerData({ sheet, sort: "recent", typeFilter: "all", search: "", token: "t" }),
      { initialProps: { sheet: "algo" as Sheet } },
    );
    await waitFor(() => expect(result.current.rows.length).toBe(25));
    act(() => { result.current.loadMore(); });
    expect(result.current.rows.length).toBe(40);
    rerender({ sheet: "following" as Sheet });
    await waitFor(() => expect(result.current.rows.length).toBe(25));
  });
});
