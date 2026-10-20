/**
 * Deterministic fake content client for Phase 1.4a. Returns predictable
 * fake posts keyed on entity + cursor so the frontend can be developed
 * end-to-end (freshness advancement, empty state, dialogue rendering)
 * before the real backend endpoint (1.4b) exists.
 *
 * Deleted once 1.4b lands and the real content endpoint takes over.
 */
import type { AmbleContentResponse, AmblePost } from "../data/schema";
import { TOWN } from "../data/town";

// The town's canned posts, keyed by entity id (data/town.ts).
const STUB_CORPUS = TOWN.stubPosts;

const EMPTY_ENTITY_IDS = new Set<string>([
  // Entities that intentionally return no content — the DialogueFrame's
  // empty-state fallback (CONTENT-05) is what the player sees.
  "empty-example",
]);

const CURSOR_PREFIX = "stub:";

/** Deterministic 32-bit string hash (djb2 variant). Only used by the stub
    to synthesise post ids from entity+index — the real backend never
    goes through this path. */
function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i); // ^ wraps to 32 bits on every step
  }
  return hash;
}

function parseIndex(cursor: string | null): number {
  if (!cursor) return 0;
  if (!cursor.startsWith(CURSOR_PREFIX)) return 0;
  const parsed = Number.parseInt(cursor.slice(CURSOR_PREFIX.length), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function makeCursor(index: number): string {
  return `${CURSOR_PREFIX}${index}`;
}

/** Simulate a small network delay so the loading state is visible in dev. */
function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

export async function fetchStubContent(
  entityId: string,
  cursor: string | null,
): Promise<AmbleContentResponse> {
  if (EMPTY_ENTITY_IDS.has(entityId)) {
    return simulateLatency({
      entity_id: entityId,
      posts: [],
      next_cursor: null,
      empty: true,
    });
  }

  const corpus = STUB_CORPUS[entityId];
  if (!corpus || corpus.length === 0) {
    return simulateLatency({
      entity_id: entityId,
      posts: [],
      next_cursor: null,
      empty: true,
    });
  }

  const index = parseIndex(cursor);
  const wrapped = index % corpus.length;
  const raw = corpus[wrapped];
  const post: AmblePost = {
    // Stub ids are deterministic hashes of entity+index — dev-only. Real
    // backend returns actual DB post_ids.
    id: Math.abs(hashCode(`${entityId}:${index}`)) % 1_000_000,
    author: raw.author,
    text: raw.text,
    unix_timestamp: raw.unix_timestamp,
    likes: 0,
    reposts: 0,
    saves: 0,
    liked_by_me: false,
    reposted_by_me: false,
  };
  const nextIndex = index + 1;
  const hasMore = nextIndex < corpus.length;
  return simulateLatency({
    entity_id: entityId,
    posts: [post],
    next_cursor: hasMore ? makeCursor(nextIndex) : null,
    empty: false,
  });
}
