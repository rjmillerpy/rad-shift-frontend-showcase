import { NextResponse } from "next/server";

// Liveness for the Next.js server: used by the Docker healthcheck in the
// backend repo's compose.yaml (and later by a load balancer). It deliberately
// does not call the API: the browser talks to the backend directly, so this
// server can serve pages whether or not the backend is up, and the backend
// has its own /health.

// Always answer from the running server, never from a build-time cache.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
