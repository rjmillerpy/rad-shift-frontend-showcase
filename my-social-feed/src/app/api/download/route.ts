import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SSRF guard — only these hosts may be proxied for download.
const ALLOWED_HOSTS = new Set<string>([
  "radshift-bucket.s3.amazonaws.com",
  "s3.amazonaws.com",
]);

// Explicit fetch timeout (rule 40/67). S3-signed URLs typically stream fast
// enough that 15 s is generous; a hung upstream must not hold the route open.
const UPSTREAM_TIMEOUT_MS = 15_000;

// Matches the backend's `_sanitize_s3_key_part` — path-traversal-safe alphabet.
const UNSAFE_FILENAME_CHARS = /[^a-zA-Z0-9._-]/g;

const FALLBACK_FILENAME = "download";

export const dynamic = "force-dynamic";

function parseTargetUrl(target: string): URL | null {
  try {
    return new URL(target, process.env.NEXT_PUBLIC_BASE_URL || undefined);
  } catch (err) {
    console.error("[api/download] Invalid target URL:", err);
    return null;
  }
}

function deriveFilename(filenameParam: string | null): string {
  // Deliberately NOT derived from the URL path: leaking the S3 key as a
  // filename is neither useful to the user nor safe. If a caller wants a
  // meaningful name they must pass `?filename=`.
  const raw = filenameParam || FALLBACK_FILENAME;
  return raw.replace(UNSAFE_FILENAME_CHARS, "_");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  const filenameParam = searchParams.get("filename");

  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const targetUrl = parseTargetUrl(target);
  if (!targetUrl) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }
  if (targetUrl.host && !ALLOWED_HOSTS.has(targetUrl.host)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (err) {
    // Broad catch is deliberate: fetch can throw AbortError, TypeError (network),
    // and undici's DNS/TLS errors. Any of them means the same to the caller:
    // the upstream URL is unreachable. Logged with the target for triage.
    console.error("[api/download] fetch failed for", targetUrl.toString(), err);
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream error: ${upstream.status}` },
      { status: 502 }
    );
  }

  const resHeaders = new Headers();
  const ct = upstream.headers.get("content-type") || "application/octet-stream";
  const len = upstream.headers.get("content-length");
  resHeaders.set("Content-Type", ct);
  if (len) resHeaders.set("Content-Length", len);

  const filename = deriveFilename(filenameParam);
  resHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);

  const cache = upstream.headers.get("cache-control");
  if (cache) resHeaders.set("Cache-Control", cache);

  return new NextResponse(upstream.body, {
    status: 200,
    headers: resHeaders,
  });
}
