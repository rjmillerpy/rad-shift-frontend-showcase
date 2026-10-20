/**
 * INT-01 client — fetches content for an entity given an optional cursor.
 * Wraps the shared `ambleGet` client so this file only contains the URL
 * shape + Zod validation at the boundary (rule 5).
 *
 * Phase 1.4a: backend endpoint hasn't been built yet (that's 1.4b), so
 * `USE_STUB` is true in dev. Flip to false — or set the env var — once
 * the real endpoint ships.
 */
import {
  AmbleContentResponseSchema,
  type AmbleContentResponse,
} from "../data/schema";
import { ambleGet } from "../lib/api";
import { fetchStubContent } from "./content-stub";

const ENDPOINT_BASE = "/amble/content";

// Toggled off in 1.4b when the real backend ships. Keeping it as an
// exported const rather than an env var so tests can override it without
// process.env plumbing.
export const USE_STUB = true;

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
