import DOMPurify from "dompurify";

/**
 * Sanitize user-authored HTML before it reaches `dangerouslySetInnerHTML`.
 *
 * The backend also sanitizes blog HTML on write, but rows stored before that
 * existed are still dirty, so we sanitize again at render time.
 *
 * DOMPurify needs a DOM. During server rendering there is none, and its
 * fallback is to return the input unchanged, so we render nothing server-side
 * and let the client pass fill it in.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html);
}
