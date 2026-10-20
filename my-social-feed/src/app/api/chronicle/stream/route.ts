import { NextRequest } from "next/server";

import { SERVER_API_URL } from "@/lib/config";

// Explicit fetch timeout to the backend (rule 40/67). Chronicle streams keep
// the connection open, so we only guard the initial handshake — once the body
// starts flowing, the client's own timeout takes over.
const HANDSHAKE_TIMEOUT_MS = 15_000;

// Boundary validation caps (rule 5). Backend Pydantic also enforces these;
// checking here means a bad query returns 400 without a wasted upstream hop.
const MIN_PAGE = 0;
const MAX_PAGE = 10_000;
const MIN_POSTS_PER_PAGE = 1;
const MAX_POSTS_PER_PAGE = 32;
const DEFAULT_PAGE = 0;
const DEFAULT_POSTS_PER_PAGE = 12;

function parseBoundedInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number | null {
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseBoundedInt(searchParams.get("page"), DEFAULT_PAGE, MIN_PAGE, MAX_PAGE);
  const postsPerPage = parseBoundedInt(
    searchParams.get("posts_per_page"),
    DEFAULT_POSTS_PER_PAGE,
    MIN_POSTS_PER_PAGE,
    MAX_POSTS_PER_PAGE,
  );

  if (page === null || postsPerPage === null) {
    return new Response("Invalid page or posts_per_page", { status: 400 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const backendUrl = `${SERVER_API_URL}/posts/chronicle/stream?page=${page}&posts_per_page=${postsPerPage}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HANDSHAKE_TIMEOUT_MS);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      headers: authHeader ? { Authorization: authHeader } : {},
      signal: controller.signal,
    });
  } catch (err) {
    // Broad catch is deliberate: any transport failure (abort/DNS/TLS) collapses
    // to "stream unavailable" for the SSE consumer. Logged for triage.
    console.error("[api/chronicle/stream] handshake failed:", err);
    return new Response("Stream unavailable", { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!backendResponse.ok || !backendResponse.body) {
    console.error(
      "[api/chronicle/stream] upstream not ok:",
      backendResponse.status,
    );
    return new Response("Stream unavailable", { status: 502 });
  }

  return new Response(backendResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
