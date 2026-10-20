/**
 * INT-01 content client. Only the HTTP client (`@/lib/api`) is mocked.
 *
 * `USE_STUB` is a compile-time constant inside content.ts: while it is true
 * the HTTP branch cannot run, so the HTTP-contract block below is skipped and
 * switches itself on (and the stub block off) the day the flag is flipped.
 */
import { fetchEntityContent, USE_STUB } from "@/app/amble/services/content";
import { fetchStubContent } from "@/app/amble/services/content-stub";
import { AmbleContentResponseSchema } from "@/app/amble/data/schema";
import { API_RETRY_BASE_MS, API_RETRY_COUNT, API_TIMEOUT_MS } from "@/app/amble/data/constants";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const mockedGet = api.get as jest.MockedFunction<typeof api.get>;
const STUB_LATENCY_MS = 120;

const post = (overrides: Record<string, unknown> = {}) => ({
  id: 7, author: "jrome", text: "hello", unix_timestamp: 1_700_000_100,
  likes: 3, reposts: 1, saves: 2, liked_by_me: true, reposted_by_me: false,
  ...overrides,
});
const payload = (overrides: Record<string, unknown> = {}) => ({
  entity_id: "wanderer", posts: [post()], next_cursor: "abc", empty: false,
  ...overrides,
});
const httpError = (status?: number, code?: string) => ({
  code, isAxiosError: true, response: status ? { status, data: {} } : undefined,
});

beforeEach(() => {
  jest.useFakeTimers();
  mockedGet.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

(USE_STUB ? describe : describe.skip)("fetchEntityContent while USE_STUB is on", () => {
  const settle = async <T,>(pending: Promise<T>): Promise<T> => {
    await jest.advanceTimersByTimeAsync(STUB_LATENCY_MS);
    return pending;
  };

  it.each([
    ["the first page", "wanderer", null],
    ["a later page", "wanderer", "stub:1"],
    ["the last page", "wanderer", "stub:2"],
    ["an entity without content", "no-such-entity", null],
  ])("returns what the stub returns for %s", async (_name, entityId, cursor) => {
    const actual = await settle(fetchEntityContent(entityId, cursor));
    const expected = await settle(fetchStubContent(entityId, cursor));
    expect(actual).toEqual(expected);
    expect(AmbleContentResponseSchema.parse(actual)).toEqual(actual);
  });

  it("threads next_cursor through so successive calls advance the feed", async () => {
    const first = await settle(fetchEntityContent("wanderer", null));
    const second = await settle(fetchEntityContent("wanderer", first.next_cursor));
    expect(first.next_cursor).not.toBeNull();
    expect(second.posts[0].id).not.toBe(first.posts[0].id);
    expect(second.posts[0].text).not.toBe(first.posts[0].text);
  });

  it("never touches the network", async () => {
    await settle(fetchEntityContent("wanderer", null));
    expect(mockedGet).not.toHaveBeenCalled();
  });
});

(USE_STUB ? describe.skip : describe)("fetchEntityContent over HTTP", () => {
  it("GETs the entity URL and returns the validated payload", async () => {
    mockedGet.mockResolvedValueOnce({ data: payload() });
    await expect(fetchEntityContent("wanderer", null)).resolves.toEqual(payload());
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith("/amble/content/wanderer", { timeout: API_TIMEOUT_MS });
  });

  it.each([
    ["no cursor", "wanderer", null, "/amble/content/wanderer"],
    ["an empty cursor", "wanderer", "", "/amble/content/wanderer"],
    ["a plain cursor", "wanderer", "abc", "/amble/content/wanderer?cursor=abc"],
    ["a cursor needing escaping", "wanderer", "a b/c&d=1", "/amble/content/wanderer?cursor=a%20b%2Fc%26d%3D1"],
    ["an entity id needing escaping", "park/district ?", null, "/amble/content/park%2Fdistrict%20%3F"],
  ])("builds the URL for %s", async (_name, entityId, cursor, url) => {
    mockedGet.mockResolvedValueOnce({ data: payload({ entity_id: entityId }) });
    await fetchEntityContent(entityId, cursor);
    expect(mockedGet.mock.calls[0][0]).toBe(url);
  });

  it("fills schema defaults and drops unknown keys", async () => {
    const bare = { id: 1, author: "a", text: "t", unix_timestamp: 5 };
    mockedGet.mockResolvedValueOnce({ data: payload({ posts: [bare], extra: "x" }) });
    const result = await fetchEntityContent("wanderer", null);
    expect(result.posts[0]).toEqual({
      ...bare, likes: 0, reposts: 0, saves: 0, liked_by_me: false, reposted_by_me: false,
    });
    expect(result).not.toHaveProperty("extra");
  });

  it.each([
    ["null", null],
    ["a string body", "<html>502</html>"],
    ["a missing next_cursor", { entity_id: "wanderer", posts: [], empty: true }],
    ["posts that is not an array", payload({ posts: "none" })],
    ["a post with a string id", payload({ posts: [post({ id: "7" })] })],
    ["a post with a fractional timestamp", payload({ posts: [post({ unix_timestamp: 1.5 })] })],
    ["a non-boolean empty flag", payload({ empty: "no" })],
  ])("rejects a malformed payload: %s", async (_name, data) => {
    mockedGet.mockResolvedValueOnce({ data });
    await expect(fetchEntityContent("wanderer", null)).rejects.toMatchObject({ name: "ZodError" });
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["401", httpError(401), "unauthorized"],
    ["403", httpError(403), "forbidden"],
    ["404", httpError(404), "not_found"],
    ["422", httpError(422), "validation"],
  ])("maps HTTP %s to a non-retried AmbleApiError", async (_name, error, code) => {
    mockedGet.mockRejectedValueOnce(error);
    await expect(fetchEntityContent("wanderer", null)).rejects.toMatchObject({
      name: "AmbleApiError", code, entityId: "wanderer",
    });
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["HTTP 500", httpError(500), "server"],
    ["HTTP 504", httpError(504), "timeout"],
    ["a client timeout", httpError(undefined, "ECONNABORTED"), "timeout"],
    ["a dropped connection", httpError(), "network"],
    ["an unmapped status", httpError(418), "unknown"],
  ])("retries %s and then maps it", async (_name, error, code) => {
    mockedGet.mockRejectedValue(error);
    const outcome = fetchEntityContent("wanderer", "abc").catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(API_RETRY_BASE_MS * 2 ** API_RETRY_COUNT);
    expect(await outcome).toMatchObject({ name: "AmbleApiError", code, entityId: "wanderer" });
    expect(mockedGet).toHaveBeenCalledTimes(API_RETRY_COUNT);
  });

  it("recovers when a retry succeeds", async () => {
    mockedGet.mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce({ data: payload() });
    const pending = fetchEntityContent("wanderer", null);
    await jest.advanceTimersByTimeAsync(API_RETRY_BASE_MS);
    await expect(pending).resolves.toEqual(payload());
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});
