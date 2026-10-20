import { renderHook, act } from "@testing-library/react";
import api from "@/lib/api";
import { useQuickAction } from "@/app/bubbles/useQuickAction";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 42, text: "Hello", username: "alice",
  likes: 1, reposts: 2, shares: 3, saves: 4, laughs: 5, unix_timestamp: 1700000000,
  ...overrides,
});
const target = makePost();
const bystander = makePost({ id: 43, text: "Other" });

type Updater = (prev: Post[]) => Post[];
const run = async (action: string, post: Post = target) => {
  const mutatePosts = jest.fn<void, [Updater]>();
  const { result } = renderHook(() => useQuickAction(mutatePosts));
  await act(async () => { await result.current(action, post); });
  /** Apply the state update the hook asked for to a two-post list. */
  const applied = () => mutatePosts.mock.calls[0][0]([target, bystander]);
  return { mutatePosts, applied };
};

const writeText = jest.fn();
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
let alertSpy: jest.SpyInstance;
let promptSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  promptSpy = jest.spyOn(window, "prompt").mockImplementation(() => null);
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  alertSpy.mockRestore();
  promptSpy.mockRestore();
  errorSpy.mockRestore();
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("useQuickAction — reactions", () => {
  it.each([
    ["like", { likes: 9, action: "liked" }, { likes: 9, liked_by_me: true }],
    ["like", { likes: 0, action: "unliked" }, { likes: 0, liked_by_me: false }],
    ["repost", { reposts: 7, action: "re-posted" }, { reposts: 7, reposted_by_me: true }],
    ["repost", { reposts: 1, action: "un-reposted" }, { reposts: 1, reposted_by_me: false }],
    ["save", { saves: 5, action: "saved" }, { saves: 5, saved_by_me: true }],
    ["save", { saves: 3, action: "unsaved" }, { saves: 3, saved_by_me: false }],
    ["laugh", { laughs: 6, action: "laughed" }, { laughs: 6, laughed_by_me: true }],
    ["laugh", { laughs: 4, action: "unlaughed" }, { laughs: 4, laughed_by_me: false }],
  ])("%s with response %j updates only the target post", async (action, data, expected) => {
    mockedApi.post.mockResolvedValue({ data });
    const { mutatePosts, applied } = await run(action);
    expect(mockedApi.post).toHaveBeenCalledWith(`/posts/${action}/42`);
    expect(mutatePosts).toHaveBeenCalledTimes(1);
    expect(applied()).toEqual([{ ...target, ...expected }, bystander]);
  });
});

describe("useQuickAction — share", () => {
  it.each([
    ["the share URL from the server", { share_url: "/s/abc" }, "http://localhost/s/abc"],
    ["the post URL when the server gives none", {}, "http://localhost/post/42"],
  ])("copies %s and tells the user", async (_name, data, copied) => {
    mockedApi.post.mockResolvedValue({ data });
    const { mutatePosts } = await run("share");
    expect(mockedApi.post).toHaveBeenCalledWith("/posts/share/42");
    expect(writeText).toHaveBeenCalledWith(copied);
    expect(alertSpy).toHaveBeenCalledWith("Post link copied!");
    expect(mutatePosts).not.toHaveBeenCalled();
  });
});

describe("useQuickAction — slop and report", () => {
  it.each([
    ["slop", "AI", { reason: "AI" }, false],
    ["report", "Spam", { reason: "[REPORT] Spam" }, true],
  ])("%s sends the reason and removes the post from the list", async (action, reason, body, confirms) => {
    promptSpy.mockReturnValue(reason);
    mockedApi.post.mockResolvedValue({ data: {} });
    const { applied } = await run(action);
    expect(mockedApi.post).toHaveBeenCalledWith("/posts/slop/42", body);
    expect(applied()).toEqual([bystander]);
    expect(alertSpy).toHaveBeenCalledTimes(confirms ? 1 : 0);
  });

  it.each([
    ["slop", null],
    ["slop", ""],
    ["report", null],
    ["report", ""],
  ])("%s does nothing when the prompt returns %p", async (action, reason) => {
    promptSpy.mockReturnValue(reason);
    const { mutatePosts } = await run(action);
    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mutatePosts).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe("useQuickAction — navigation and failures", () => {
  it.each([
    ["quote", "/post/42?quote=1"],
    ["replies", "/post/42?reply=1"],
  ])("%s navigates to %s without calling the API", async (action, url) => {
    const { mutatePosts } = await run(action);
    expect(mockPush).toHaveBeenCalledWith(url);
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mutatePosts).not.toHaveBeenCalled();
  });

  it("ignores an unknown action", async () => {
    const { mutatePosts } = await run("teleport");
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mutatePosts).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it.each(["like", "share", "slop", "report"])(
    "%s logs and leaves the list alone when the API fails",
    async (action) => {
      promptSpy.mockReturnValue("reason");
      mockedApi.post.mockRejectedValue(new Error("boom"));
      const { mutatePosts } = await run(action);
      expect(errorSpy).toHaveBeenCalledWith("Quick action failed:", expect.any(Error));
      expect(mutatePosts).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    },
  );

  it("logs instead of throwing when the clipboard write is refused", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    writeText.mockRejectedValue(new Error("denied"));
    await run("share");
    expect(errorSpy).toHaveBeenCalledWith("Quick action failed:", expect.any(Error));
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
