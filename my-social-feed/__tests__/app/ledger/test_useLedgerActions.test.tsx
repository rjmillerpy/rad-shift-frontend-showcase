import { renderHook, act } from "@testing-library/react";
import api from "@/lib/api";
import type { Post } from "@/types/post";
import { useLedgerActions } from "@/app/ledger/useLedgerActions";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1, text: "hi", username: "alice",
    profile_picture_url: null, image_url: null, image_urls: [], video_url: null, audio_url: null,
    document_urls: [], likes: 0, laughs: 0, shares: 0, reposts: 0, saves: 0,
    liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
    is_followed_by_me: false, is_me: false, unix_timestamp: 1_700_000_000,
    replies_count: 0, quotes_count: 0, slop_count: 0,
    reposted_by: null, quoted_post: null, media_metadata: null, post_metadata: {},
    ...overrides,
  } as Post;
}

beforeEach(() => { jest.clearAllMocks(); });

describe("useLedgerActions", () => {
  it("fires POST /posts/like/{id} for reaction actions", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const onDone = jest.fn();
    const { result } = renderHook(() => useLedgerActions(onDone));
    await act(async () => { await result.current("like", makePost({ id: 7 })); });
    expect(mockedApi.post).toHaveBeenCalledWith("/posts/like/7");
    expect(onDone).toHaveBeenCalled();
  });

  it.each([
    ["quote",   "/post/7?quote=1"],
    ["replies", "/post/7?reply=1"],
  ])("routes %s to %s", async (action, expected) => {
    const onDone = jest.fn();
    const { result } = renderHook(() => useLedgerActions(onDone));
    await act(async () => { await result.current(action, makePost({ id: 7 })); });
    expect(mockPush).toHaveBeenCalledWith(expected);
  });

  it("logs on failure but still fires onDone (graceful degrade)", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const onDone = jest.fn();
    const { result } = renderHook(() => useLedgerActions(onDone));
    await act(async () => { await result.current("like", makePost({ id: 9 })); });
    expect(spy).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does nothing for an unknown action other than closing the menu", async () => {
    const onDone = jest.fn();
    const { result } = renderHook(() => useLedgerActions(onDone));
    await act(async () => { await result.current("nope", makePost()); });
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });
});
