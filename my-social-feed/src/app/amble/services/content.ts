/**
 * INT-01 client — fetches content for an entity given an optional cursor.
 * Wraps the shared `ambleGet` client so this file only contains the URL
 * shape + Zod validation at the boundary (rule 5).
 *
 * The backend endpoint (GET /amble/content/{entity_id}) shipped in 1.4b,
 * and since 2026-11-25 Amble reads from it: `USE_STUB` is false. The stub
 * (content-stub.ts) stays for working on the town offline.
 */
import {
  AmbleContentResponseSchema,
  type AmbleContentResponse,
} from "../data/schema";
import { ambleGet } from "../lib/api";
import { fetchStubContent } from "./content-stub";

const ENDPOINT_BASE = "/amble/content";

// An exported const rather than an env var so tests can see which branch
// runs without process.env plumbing. Set true to work on the town offline.
export const USE_STUB = false;

/** Fetch the next slice of content for a given entity. `cursor` comes from
    the previous response's `next_cursor` (null on the first request). */
export async function fetchEntityContent(
  entityId: string,
  cursor: string | null,
): Promise<AmbleContentResponse> {
  if (USE_STUB) {
    return fetchStubContent(entityId, cursor);
  }
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const url = `${ENDPOINT_BASE}/${encodeURIComponent(entityId)}${query}`;
  const raw = await ambleGet<unknown>(url, entityId);
  return AmbleContentResponseSchema.parse(raw);
}
