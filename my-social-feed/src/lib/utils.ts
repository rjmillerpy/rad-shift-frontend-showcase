/**
 * Nitter instances host `/pic/{url-encoded-path}` endpoints that just proxy
 * the corresponding `pbs.twimg.com/{path}` file. We rewrite these to the
 * canonical twimg URL so the image works regardless of which Nitter instance
 * was scraped and so it hits an allow-listed host in our image proxy.
 */
const NITTER_PIC_PREFIX = /^https?:\/\/[^/]+\/pic\//;

function rewriteNitterToTwimg(url: string): string {
  if (!NITTER_PIC_PREFIX.test(url)) return url;
  const path = url.replace(NITTER_PIC_PREFIX, "");
  try {
    return `https://pbs.twimg.com/${decodeURIComponent(path)}`;
  } catch {
    // Malformed percent-encoding — fall back to the original URL rather than
    // swallowing the image entirely.
    return url;
  }
}

export function proxyIfNeeded(url?: string) {
  if (!url || !url.startsWith("http")) return url;
  const canonical = rewriteNitterToTwimg(url);
  return `/api/image-proxy?url=${encodeURIComponent(canonical)}`;
}

/**
 * True when `url` is a ui-avatars.com initials placeholder rather than a real
 * user-supplied image. Some backend generators (notably the X / Nitter scraper)
 * populate `image_url` with a ui-avatars fallback when the source tweet has no
 * media attached — treating that as a real image produces garbage-looking
 * picture frames with just initials in them.
 */
export function isPlaceholderAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("ui-avatars.com");
}

/** Convert a seconds duration into "M:SS" media-player format. Returns
    "0:00" for non-finite or negative input (invalid duration during load). */
export function formatMediaTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
