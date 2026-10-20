import {
  CHRONICLE_TITLE_KEY,
  DEFAULT_UNTITLED,
  FALLBACK_TIMEOUT_MS,
  POSTS_PER_PAGE_FALLBACK,
  POSTS_PER_PAGE_STREAM,
} from "@/app/chronicle/types";
import type { ChapterData, Segment } from "@/app/chronicle/types";
import type { Post } from "@/types/post";

const post: Post = {
  id: 1, text: "First post about technology", username: "alice",
  likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 3, unix_timestamp: 1700000000,
  image_url: "https://example.com/pic.jpg",
};

// One fixture per Segment variant, so `tsc` checks each shape.
const narrative: Segment = { type: "narrative", text: "As the day unfolded..." };
const postRef: Segment = { type: "post", index: 0 };
const mediaRef: Segment = { type: "media", index: 0 };

const chapter: ChapterData = {
  segments: [narrative, postRef, mediaRef],
  posts: [post],
  page: 0,
  has_more: true,
  cached: false,
};

/** Narrowing helper: only compiles if every Segment variant is handled. */
function describeSegment(seg: Segment, posts: Post[]): string {
  switch (seg.type) {
    case "narrative":
      return seg.text;
    case "post":
    case "media":
      return posts[seg.index]?.text ?? "<missing>";
  }
}

describe("chronicle types — constants", () => {
  it.each([
    ["POSTS_PER_PAGE_STREAM", POSTS_PER_PAGE_STREAM],
    ["POSTS_PER_PAGE_FALLBACK", POSTS_PER_PAGE_FALLBACK],
    ["FALLBACK_TIMEOUT_MS", FALLBACK_TIMEOUT_MS],
  ])("%s is a positive integer", (_name, value) => {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
  });

  it("streams fewer posts per page than the non-streaming fallback", () => {
    expect(POSTS_PER_PAGE_STREAM).toBeLessThan(POSTS_PER_PAGE_FALLBACK);
  });

  it("gives the fallback request minutes, not seconds, but no more than 10 minutes", () => {
    expect(FALLBACK_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
    expect(FALLBACK_TIMEOUT_MS).toBeLessThanOrEqual(10 * 60_000);
  });

  it("uses a non-empty storage key that differs from the default title", () => {
    expect(CHRONICLE_TITLE_KEY).toMatch(/^[a-z_]+$/);
    expect(DEFAULT_UNTITLED.trim()).not.toBe("");
    expect(DEFAULT_UNTITLED).toBe(DEFAULT_UNTITLED.trim());
    expect(CHRONICLE_TITLE_KEY).not.toBe(DEFAULT_UNTITLED);
  });
});

describe("chronicle types — shapes", () => {
  it.each([
    ["narrative", narrative, "As the day unfolded..."],
    ["post", postRef, "First post about technology"],
    ["media", mediaRef, "First post about technology"],
    ["post with a dangling index", { type: "post", index: 9 } as Segment, "<missing>"],
  ])("a %s segment resolves against the chapter's posts", (_name, segment, expected) => {
    expect(describeSegment(segment, chapter.posts)).toBe(expected);
  });

  it("a chapter fixture holds every segment variant and only in-range post references", () => {
    expect(new Set(chapter.segments.map((s) => s.type))).toEqual(new Set(["narrative", "post", "media"]));
    for (const seg of chapter.segments) {
      if (seg.type !== "narrative") expect(seg.index).toBeLessThan(chapter.posts.length);
    }
    expect(chapter).toMatchObject({ page: 0, has_more: true, cached: false });
  });
});
