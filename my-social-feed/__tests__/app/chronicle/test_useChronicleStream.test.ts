import { renderHook, act, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import { useChronicleStream } from "@/app/chronicle/useChronicleStream";
import {
  FALLBACK_TIMEOUT_MS,
  POSTS_PER_PAGE_FALLBACK,
  POSTS_PER_PAGE_STREAM,
} from "@/app/chronicle/types";
import type { ChapterData, Segment } from "@/app/chronicle/types";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const mockedApi = api as jest.Mocked<typeof api>;

/** Minimal stand-in for the browser EventSource; tests drive it explicitly. */
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = jest.fn();
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  emit(message: unknown) { this.onmessage?.({ data: JSON.stringify(message) }); }
  emitRaw(data: string) { this.onmessage?.({ data }); }
  fail() { this.onerror?.(); }
}

const globalWithES = globalThis as unknown as { EventSource?: unknown };
const originalEventSource = globalWithES.EventSource;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  FakeEventSource.instances = [];
  globalWithES.EventSource = FakeEventSource;
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
  if (originalEventSource === undefined) delete globalWithES.EventSource;
  else globalWithES.EventSource = originalEventSource;
});

const posts = [
  { id: 1, text: "First", username: "alice", likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1 },
  { id: 2, text: "Second", username: "bob", likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 2 },
];
const narrative: Segment = { type: "narrative", text: "Once upon a time" };
const postRef: Segment = { type: "post", index: 0 };

/** Render the hook and open a stream for `page`; returns the stream the hook created. */
const start = (page = 0, token: string | null = null) => {
  const hook = renderHook(() => useChronicleStream(token));
  act(() => { hook.result.current.fetchChapter(page); });
  return { ...hook, es: FakeEventSource.instances[0] };
};

describe("useChronicleStream — opening a stream", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useChronicleStream(null));
    expect(result.current).toMatchObject({ chapters: [], loading: false, generating: false });
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it.each([
    ["with the token when logged in", "tok123", 2, "tok123"],
    ["without a token when logged out", null, 0, null],
  ])("requests the page %s and reports loading", (_name, token, page, expectedToken) => {
    const { result, es } = start(page, token);
    expect(result.current).toMatchObject({ loading: true, generating: false, chapters: [] });
    const url = new URL(es.url);
    expect(url.pathname).toBe("/posts/chronicle/stream");
    expect(url.searchParams.get("page")).toBe(String(page));
    expect(url.searchParams.get("posts_per_page")).toBe(String(POSTS_PER_PAGE_STREAM));
    expect(url.searchParams.get("token")).toBe(expectedToken);
  });

  it("closes the previous stream when another chapter is requested", () => {
    const { result, es } = start(0);
    act(() => { result.current.fetchChapter(1); });
    expect(es.close).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1].close).not.toHaveBeenCalled();
  });

  it("closeStream closes the open stream, and is a no-op with nothing open", () => {
    const { result, es } = start(0);
    act(() => { result.current.closeStream(); });
    expect(es.close).toHaveBeenCalledTimes(1);
    act(() => { result.current.closeStream(); });
    expect(es.close).toHaveBeenCalledTimes(1);
  });
});

describe("useChronicleStream — stream messages", () => {
  it("init stops loading, starts generating and seeds the chapter with its posts", () => {
    const { result, es } = start(0);
    act(() => { es.emit({ type: "init", page: 0, posts, has_more: true }); });
    expect(result.current).toMatchObject({ loading: false, generating: true });
    expect(result.current.chapters[0]).toEqual({ segments: [], posts, page: 0, has_more: true, cached: false });
  });

  it("init without page, posts or has_more falls back to the requested page and safe defaults", () => {
    const { result, es } = start(3);
    act(() => { es.emit({ type: "init" }); });
    expect(result.current.chapters[3]).toEqual({ segments: [], posts: [], page: 3, has_more: false, cached: false });
  });

  it("segment messages append in order; token messages are ignored", () => {
    const { result, es } = start(0);
    act(() => {
      es.emit({ type: "init", page: 0, posts, has_more: true });
      es.emit({ type: "segment", segment: narrative });
      es.emit({ type: "token", text: "{\"partial" });
      es.emit({ type: "segment", segment: postRef });
    });
    expect(result.current.chapters[0].segments).toEqual([narrative, postRef]);
    expect(result.current.chapters[0].posts).toEqual(posts);
    expect(result.current.generating).toBe(true);
  });

  it("a segment arriving before init is dropped rather than creating a broken chapter", () => {
    const { result, es } = start(0);
    act(() => { es.emit({ type: "segment", segment: narrative }); });
    expect(result.current.chapters[0]).toBeUndefined();
    expect(result.current.loading).toBe(true);
  });

  it.each([
    ["final segments from a fresh generation", { segments: [narrative, postRef] }, [narrative, postRef], false],
    ["a cached chapter", { segments: [narrative], cached: true }, [narrative], true],
    ["no segments at all", {}, [], false],
  ])("done with %s finishes generating, keeps the posts and closes the stream", (_name, done, segments, cached) => {
    const { result, es } = start(0);
    act(() => {
      es.emit({ type: "init", page: 0, posts, has_more: true });
      es.emit({ type: "segment", segment: { type: "narrative", text: "draft" } });
      es.emit({ type: "done", ...done });
    });
    expect(result.current.generating).toBe(false);
    expect(result.current.chapters[0]).toEqual({ segments, posts, page: 0, has_more: true, cached });
    expect(es.close).toHaveBeenCalledTimes(1);
  });

  it("done without a preceding init still produces a complete, empty-post chapter", () => {
    const { result, es } = start(1);
    act(() => { es.emit({ type: "done", segments: [narrative] }); });
    expect(result.current.chapters[1]).toEqual({
      segments: [narrative], posts: [], page: 1, has_more: false, cached: false,
    });
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["an empty payload", ""],
  ])("ignores %s without crashing or changing state", (_name, raw) => {
    const { result, es } = start(0);
    act(() => { es.emit({ type: "init", page: 0, posts, has_more: false }); });
    const before = result.current.chapters;
    act(() => { es.emitRaw(raw); });
    expect(errorSpy).toHaveBeenCalledWith("Failed to parse chronicle event:", expect.any(Error));
    expect(result.current.chapters).toBe(before);
    expect(result.current.generating).toBe(true);
    expect(es.close).not.toHaveBeenCalled();
    // The stream keeps working afterwards.
    act(() => { es.emit({ type: "segment", segment: narrative }); });
    expect(result.current.chapters[0].segments).toEqual([narrative]);
  });

  it("setChapters lets the caller patch chapters directly", () => {
    const { result } = renderHook(() => useChronicleStream(null));
    const chapter: ChapterData = { segments: [narrative], posts: [], page: 0, has_more: false, cached: true };
    act(() => { result.current.setChapters([chapter]); });
    expect(result.current.chapters).toEqual([chapter]);
  });
});

describe("useChronicleStream — fallback when the stream errors", () => {
  const fallbackChapter: ChapterData = {
    segments: [narrative, postRef], posts: [], page: 2, has_more: false, cached: false,
  };

  it("closes the stream and loads the whole chapter through the API", async () => {
    mockedApi.get.mockResolvedValue({ data: fallbackChapter });
    const { result, es } = start(2);
    act(() => { es.emit({ type: "init", page: 2, posts, has_more: true }); });
    await act(async () => { es.fail(); });

    expect(es.close).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/posts/chronicle", {
      params: { page: 2, posts_per_page: POSTS_PER_PAGE_FALLBACK },
      timeout: FALLBACK_TIMEOUT_MS,
    });
    await waitFor(() => expect(result.current.chapters[2]).toEqual(fallbackChapter));
    expect(result.current).toMatchObject({ loading: false, generating: false });
  });

  it("stops loading, logs and leaves chapters untouched when the fallback also fails", async () => {
    mockedApi.get.mockRejectedValue(new Error("offline"));
    const { result, es } = start(0);
    expect(result.current.loading).toBe(true);
    await act(async () => { es.fail(); });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.generating).toBe(false);
    expect(result.current.chapters).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith("Chronicle fetch failed:", expect.any(Error));
  });
});
