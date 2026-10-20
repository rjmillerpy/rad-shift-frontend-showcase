import { NextRequest, NextResponse } from "next/server";

// Hostnames the proxy is willing to fetch from. Kept as a small explicit
// allow-list to prevent this endpoint from becoming an open SSRF relay.
//
// Categories:
//   • S3 / avatar service: our own storage + the fallback avatar service.
//   • Bot content CDNs: images embedded in posts created by the generator
//     bots need to be served with a Referer header the origin CDNs accept,
//     which browsers won't provide from a `crossOrigin="anonymous"` <img>.
//     Routing through this proxy is what makes them render.
const ALLOWED_HOSTS = new Set<string>([
  "radshift-bucket.s3.amazonaws.com",
  "s3.amazonaws.com",
  "ui-avatars.com",
  // Pinterest — used by the `pinterest` generator platform.
  "i.pinimg.com",
  "s.pinimg.com",
  // Reddit — used by the `reddit` generator platform.
  //   i.redd.it: native Reddit-hosted media
  //   preview.redd.it: Reddit's preview for native media
  //   external-preview.redd.it: Reddit's preview for links to external content
  //     (many text-post-with-link entries use this)
  "i.redd.it",
  "preview.redd.it",
  "external-preview.redd.it",
  // Twitter / X — used by the `x` and `x_search` generator platforms
  // (Nitter rewrites tweet media URLs to pbs.twimg.com).
  "pbs.twimg.com",
]);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch (e) {
    console.error("Image proxy error:", e);
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const resp = await fetch(targetUrl.toString());
  if (!resp.ok) return NextResponse.json({ error: "Upstream failed" }, { status: 502 });

  const bytes = new Uint8Array(await resp.arrayBuffer());
  const contentType = resp.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
