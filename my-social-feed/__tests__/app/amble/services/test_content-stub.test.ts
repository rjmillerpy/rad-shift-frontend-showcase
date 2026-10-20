/**
 * Stub content client: deterministic fake posts keyed on entity + cursor,
 * served from the town's canned posts (data/town.ts), so the expectations
 * are read from the same data. The stub resolves after a 120ms setTimeout,
 * so every test drives it with fake timers instead of waiting.
 */
import { fetchStubContent } from "@/app/amble/services/content-stub";
import { AmbleContentResponseSchema, type AmbleContentResponse } from "@/app/amble/data/schema";
import { TOWN } from "@/app/amble/data/town";

const CORPUS = Object.entries(TOWN.stubPosts);
/** An entity with at least two posts, so cursors have somewhere to go. */
const [MULTI, MULTI_POSTS] = CORPUS.find(([, posts]) => posts.length >= 2)!;
const [OTHER] = CORPUS.find(([id]) => id !== MULTI)!;

const LATENCY_MS = 120;

async function fetchNow(entityId: string, cursor: string | null): Promise<AmbleContentResponse> {
  const pending = fetchStubContent(entityId, cursor);
  await jest.advanceTimersByTimeAsync(LATENCY_MS);
  return pending;
}

/** Follow next_cursor from the first request until it runs out. */
async function walkFeed(entityId: string): Promise<AmbleContentResponse[]> {
  const pages: AmbleContentResponse[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 20; guard += 1) {
    const page = await fetchNow(entityId, cursor);
    pages.push(page);
    cursor = page.next_cursor;
    if (cursor === null) break;
  }
  return pages;
}

describe("fetchStubContent", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(CORPUS)("serves the %s corpus one post per page until the cursor runs out", async (entityId, posts) => {
    const pages = await walkFeed(entityId);

    expect(pages.map((p) => p.posts.map((post) => post.author))).toEqual(posts.map((post) => [post.author]));
    expect(pages.map((p) => p.next_cursor)).toEqual([
      ...posts.slice(1).map((_p, index) => `stub:${index + 1}`),
      null,
    ]);
    for (const page of pages) {
      expect(page).toMatchObject({ entity_id: entityId, empty: false });
      // Valid at the same boundary schema the real endpoint is parsed with.
      expect(AmbleContentResponseSchema.parse(page)).toEqual(page);
    }
    const ids = pages.map((p) => p.posts[0].id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("starts every post with zeroed engagement", async () => {
    const { posts } = await fetchNow(MULTI, null);
    expect(posts[0]).toMatchObject({
      text: MULTI_POSTS[0].text,
      unix_timestamp: MULTI_POSTS[0].unix_timestamp,
      likes: 0, reposts: 0, saves: 0, liked_by_me: false, reposted_by_me: false,
    });
  });

  it.each([
    ["an entity with no corpus", "no-such-entity"],
    ["the intentionally empty entity", "empty-example"],
    ["an empty entity id", ""],
  ])("returns the empty payload for %s", async (_name, entityId) => {
    await expect(fetchNow(entityId, "stub:1")).resolves.toEqual({
      entity_id: entityId, posts: [], next_cursor: null, empty: true,
    });
  });

  const last = MULTI_POSTS.length - 1;
  const after = (index: number) => (index < last ? `stub:${index + 1}` : null);
  it.each([
    ["null (first request)", null, 0],
    ["an empty string", "", 0],
    ["a cursor without the stub: prefix", "1", 0],
    ["a non-numeric index", "stub:abc", 0],
    ["a negative index", "stub:-1", 0],
    ["index 1", "stub:1", 1],
    ["a fractional index (truncated)", "stub:1.9", 1],
    ["the last index", `stub:${last}`, last],
  ])("reads cursor %s", async (_name, cursor, index) => {
    const page = await fetchNow(MULTI, cursor);
    expect(page.posts.map((p) => p.author)).toEqual([MULTI_POSTS[index].author]);
    expect(page.next_cursor).toBe(after(index));
  });

  it("wraps an index past the end, with no further cursor", async () => {
    const past = MULTI_POSTS.length + 1;
    const page = await fetchNow(MULTI, `stub:${past}`);
    expect(page.posts.map((p) => p.author)).toEqual([MULTI_POSTS[past % MULTI_POSTS.length].author]);
    expect(page.next_cursor).toBeNull();
  });

  it("is deterministic: the same entity and cursor give the same post id", async () => {
    const first = await fetchNow(MULTI, "stub:1");
    const again = await fetchNow(MULTI, "stub:1");
    const other = await fetchNow(OTHER, "stub:1");
    expect(again).toEqual(first);
    expect(Number.isInteger(first.posts[0].id)).toBe(true);
    expect(first.posts[0].id).toBeGreaterThanOrEqual(0);
    expect(first.posts[0].id).toBeLessThan(1_000_000);
    expect(other.posts[0].id).not.toBe(first.posts[0].id);
  });

  it.each([
    ["a content response", MULTI],
    ["an empty response", "no-such-entity"],
  ])("holds %s back for the simulated latency", async (_name, entityId) => {
    const onResolve = jest.fn();
    void fetchStubContent(entityId, null).then(onResolve);

    await jest.advanceTimersByTimeAsync(LATENCY_MS - 1);
    expect(onResolve).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
