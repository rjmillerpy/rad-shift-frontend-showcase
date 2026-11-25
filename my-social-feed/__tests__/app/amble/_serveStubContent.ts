/**
 * Test helper: answers Amble's content requests through a mocked `@/lib/api`
 * with the town's canned posts (services/content-stub.ts), as the backend's
 * GET /amble/content/{entity_id} would. Only the HTTP boundary is mocked, so
 * the real client runs: URL, cursor, retries, schema validation.
 *
 * Amble read the stub directly until 2026-11-25 (USE_STUB); tests that rely
 * on canned content call this in beforeEach.
 */
import api from "@/lib/api";
import { fetchStubContent } from "@/app/amble/services/content-stub";

const CONTENT_URL = /^\/amble\/content\/([^?]+)(?:\?cursor=(.+))?$/;

export function serveStubContent(): void {
  (api.get as jest.Mock).mockImplementation(async (url: string) => {
    const match = CONTENT_URL.exec(url);
    if (!match) throw new Error(`unexpected GET ${url}`);
    const [, entityId, cursor] = match;
    return {
      data: await fetchStubContent(
        decodeURIComponent(entityId),
        cursor ? decodeURIComponent(cursor) : null,
      ),
    };
  });
}
