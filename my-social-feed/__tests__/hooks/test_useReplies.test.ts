import { renderHook, act } from "@testing-library/react";
import api from "@/lib/api";
import { useReplies } from "@/hooks/useReplies";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const makeReply = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  text: `reply ${id}`,
  username: `user${id}`,
  likes: 0,
  laughs: 0,
  reposts: 0,
  shares: 0,
  saves: 0,
  unix_timestamp: 1700000000 + id,
  ...overrides,
});

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  mockedApi.get.mockResolvedValue({ data: { replies: [] } });
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("useReplies", () => {
  it("starts with every thread closed and nothing fetched", () => {
    const { result } = renderHook(() => useReplies());
    expect(result.current.openReplies).toEqual({});
    expect(result.current.repliesByPost).toEqual({});
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("opens a thread and fetches its replies once", async () => {
    mockedApi.get.mockResolvedValue({ data: { replies: [makeReply(1), makeReply(2)] } });
    const { result } = renderHook(() => useReplies());

    await act(async () => { await result.current.toggleReplies(7); });

    expect(result.current.openReplies[7]).toBe(true);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/posts/7/replies");
    expect(result.current.repliesByPost[7].map((r) => r.text)).toEqual(["reply 1", "reply 2"]);
  });

  it("closes the thread on the second toggle without fetching, keeping the replies", async () => {
    mockedApi.get.mockResolvedValue({ data: { replies: [makeReply(1)] } });
    const { result } = renderHook(() => useReplies());

    await act(async () => { await result.current.toggleReplies(7); });
    await act(async () => { await result.current.toggleReplies(7); });

    expect(result.current.openReplies[7]).toBe(false);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(result.current.repliesByPost[7]).toHaveLength(1);
  });

  it("refreshes the replies when a closed thread is opened again", async () => {
    const { result } = renderHook(() => useReplies());
    await act(async () => { await result.current.toggleReplies(7); });
    await act(async () => { await result.current.toggleReplies(7); });

    mockedApi.get.mockResolvedValue({ data: { replies: [makeReply(3)] } });
    await act(async () => { await result.current.toggleReplies(7); });

    expect(result.current.openReplies[7]).toBe(true);
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
    expect(result.current.repliesByPost[7].map((r) => r.id)).toEqual([3]);
  });

  test.each<[string, Record<string, unknown>, boolean, boolean]>([
    ["missing flags", {}, false, false],
    ["null flags", { is_me: null, saved_by_me: null }, false, false],
    ["explicit true flags", { is_me: true, saved_by_me: true }, true, true],
    ["explicit false flags", { is_me: false, saved_by_me: false }, false, false],
    ["mixed flags", { is_me: true }, true, false],
  ])("normalises replies with %s", async (_name, flags, isMe, savedByMe) => {
    mockedApi.get.mockResolvedValue({ data: { replies: [makeReply(1, flags)] } });
    const { result } = renderHook(() => useReplies());
    await act(async () => { await result.current.toggleReplies(7); });

    const [reply] = result.current.repliesByPost[7];
    expect(reply.is_me).toBe(isMe);
    expect(reply.saved_by_me).toBe(savedByMe);
    expect(reply).toMatchObject({ id: 1, text: "reply 1", username: "user1" });
  });

  test.each([
    ["no replies key", {}],
    ["a null replies value", { replies: null }],
    ["an empty list", { replies: [] }],
  ])("stores an empty thread when the response has %s", async (_name, data) => {
    mockedApi.get.mockResolvedValue({ data });
    const { result } = renderHook(() => useReplies());
    await act(async () => { await result.current.toggleReplies(7); });
    expect(result.current.repliesByPost[7]).toEqual([]);
  });

  it("leaves the thread open with no replies when the fetch fails, without throwing", async () => {
    const failure = new Error("network down");
    mockedApi.get.mockRejectedValue(failure);
    const { result } = renderHook(() => useReplies());

    await act(async () => {
      await expect(result.current.toggleReplies(7)).resolves.toBeUndefined();
    });

    expect(result.current.openReplies[7]).toBe(true);
    expect(result.current.repliesByPost[7]).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith("Error fetching replies:", failure);
  });

  it("fetchReplies loads replies directly without opening the thread", async () => {
    mockedApi.get.mockResolvedValue({ data: { replies: [makeReply(5)] } });
    const { result } = renderHook(() => useReplies());

    await act(async () => { await result.current.fetchReplies(9); });

    expect(mockedApi.get).toHaveBeenCalledWith("/posts/9/replies");
    expect(result.current.repliesByPost[9].map((r) => r.id)).toEqual([5]);
    expect(result.current.openReplies[9]).toBeUndefined();
  });

  it("keeps threads independent of each other", async () => {
    mockedApi.get.mockImplementation((url: string) =>
      Promise.resolve({ data: { replies: [makeReply(url === "/posts/1/replies" ? 10 : 20)] } }),
    );
    const { result } = renderHook(() => useReplies());

    await act(async () => { await result.current.toggleReplies(1); });
    await act(async () => { await result.current.toggleReplies(2); });
    await act(async () => { await result.current.toggleReplies(1); });

    expect(result.current.openReplies).toEqual({ 1: false, 2: true });
    expect(result.current.repliesByPost[1].map((r) => r.id)).toEqual([10]);
    expect(result.current.repliesByPost[2].map((r) => r.id)).toEqual([20]);
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
  });

  it("keeps fetchReplies stable across renders", async () => {
    const { result } = renderHook(() => useReplies());
    const first = result.current.fetchReplies;
    await act(async () => { await result.current.toggleReplies(1); });
    expect(result.current.fetchReplies).toBe(first);
  });

  it("offers the same state and handlers under PostCard's prop names", () => {
    const { result } = renderHook(() => useReplies());
    const { replyProps } = result.current;
    expect(replyProps.openReplies).toBe(result.current.openReplies);
    expect(replyProps.repliesByPost).toBe(result.current.repliesByPost);
    expect(replyProps.onFetchReplies).toBe(result.current.fetchReplies);
    expect(replyProps.onToggleReplies).toBe(result.current.toggleReplies);
  });
});
