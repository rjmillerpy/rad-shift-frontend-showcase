/**
 * Responsive post images (roadmap item 28). After upload, the backend's media
 * pipeline records every width each image is available at: WebP copies at
 * 480 and 1280 px plus the original at its own width. This turns that into a
 * `srcset`, so a phone downloads the 480 px copy instead of a 12 MP photo.
 * Until the pipeline has run (or for older posts) there's no entry, and the
 * <img> just uses its `src`.
 */

/** `post.image_variants`: {original URL: {"480": url, "1280": url, "<width>": original}}. */
export type ImageVariants = Record<string, Record<string, string>>;

// How wide each layout draws an image, for the browser's choice of candidate.
// The feed column is at most 600 px; a gallery cell is half of it.
export const FEED_IMAGE_SIZES = "(max-width: 600px) 100vw, 600px";
export const GALLERY_CELL_SIZES = "(max-width: 600px) 50vw, 300px";
export const LIGHTBOX_IMAGE_SIZES = "90vw";
// Orbit bubbles are 70-110 px across (app/bubbles/useAnimation.ts).
export const BUBBLE_IMAGE_SIZES = "120px";

const identity = (url: string) => url;

/**
 * "url 480w, url 1280w, url 4000w" (narrowest first) for `url`, or undefined
 * when nothing is recorded. `toSrc` is applied to each candidate, as the view
 * applies it to `src` (e.g. proxyIfNeeded).
 */
export function srcSetFor(
  variants: ImageVariants | null | undefined,
  url: string | null | undefined,
  toSrc: (url: string) => string | undefined = identity,
): string | undefined {
  const sizes = url ? variants?.[url] : undefined;
  if (!sizes) return undefined;
  const candidates = Object.entries(sizes)
    .map(([width, candidate]) => [Number(width), toSrc(candidate)] as const)
    .filter(([width, candidate]) => Number.isInteger(width) && width > 0 && candidate)
    .sort(([a], [b]) => a - b);
  if (candidates.length === 0) return undefined;
  return candidates.map(([width, candidate]) => `${candidate} ${width}w`).join(", ");
}
