import {
  arrangeOrbitBubbles,
  extractPostCategories,
  getMicroCategories,
  seededRandom,
} from "@/app/bubbles/orbit";
import type { Post } from "@/types/post";

// Minimal post factory — only the fields the helpers touch.
function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    text: "",
    username: "u",
    profile_picture_url: null,
    image_url: null,
    image_urls: [],
    video_url: null,
    audio_url: null,
    document_urls: [],
    likes: 0, laughs: 0, shares: 0, reposts: 0, saves: 0,
    liked_by_me: false, reposted_by_me: false, saved_by_me: false,
    laughed_by_me: false, is_followed_by_me: false, is_me: false,
    unix_timestamp: 0,
    replies_count: 0, quotes_count: 0, slop_count: 0,
    reposted_by: null,
    quoted_post: null,
    media_metadata: null,
    post_metadata: {},
    ...overrides,
  } as Post;
}

describe("seededRandom", () => {
  it("produces the same sequence for the same seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produces different sequences for different seeds", () => {
    const a = seededRandom(42);
    const b = seededRandom(43);
    expect(a()).not.toBe(b());
  });

  it("returns values in [0, 1)", () => {
    const r = seededRandom(1);
    for (let i = 0; i < 20; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("extractPostCategories", () => {
  it("returns [] for a post with no metadata", () => {
    expect(extractPostCategories(makePost({ post_metadata: undefined as unknown as {} }))).toEqual([]);
  });

  it("parses pipe-separated tag strings", () => {
    const post = makePost({ post_metadata: { tags: "one|two|three|four" as unknown as string[] } });
    // MAX_MAJOR_CATEGORIES = 2 so the tail is dropped.
    expect(extractPostCategories(post)).toEqual(["one", "two"]);
  });

  it("parses array tag payloads", () => {
    const post = makePost({ post_metadata: { tags: ["alpha", "beta", "gamma"] } });
    expect(extractPostCategories(post)).toEqual(["alpha", "beta"]);
  });

  it("strips whitespace-only entries", () => {
    const post = makePost({ post_metadata: { tags: "  |real|  " as unknown as string[] } });
    expect(extractPostCategories(post)).toEqual(["real"]);
  });

  it("ignores non-string entries in an array payload", () => {
    const post = makePost({
      post_metadata: { tags: ["ok", 42 as unknown as string, "also"] },
    });
    expect(extractPostCategories(post)).toEqual(["ok", "also"]);
  });
});

describe("getMicroCategories", () => {
  it("returns [] for unknown topic", () => {
    expect(getMicroCategories("noSuchTopic")).toEqual([]);
  });

  it("returns up to `count` items", () => {
    const three = getMicroCategories("technology", 3);
    const five = getMicroCategories("technology", 5);
    expect(three.length).toBe(3);
    expect(five.length).toBeGreaterThanOrEqual(5);
  });

  it("is deterministic for the same topic", () => {
    expect(getMicroCategories("music", 4)).toEqual(getMicroCategories("music", 4));
  });
});

describe("arrangeOrbitBubbles", () => {
  it("returns one position per requested item", () => {
    const positions = arrangeOrbitBubbles(500, 400, 8, 200, [100, 100, 100, 100, 100, 100, 100, 100], 1200, 800);
    expect(positions).toHaveLength(8);
  });

  it("clamps every returned position inside the viewport", () => {
    const viewW = 800, viewH = 600;
    const positions = arrangeOrbitBubbles(400, 300, 12, 200, Array(12).fill(80), viewW, viewH);
    for (const pos of positions) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(viewW);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(viewH);
    }
  });

  it("keeps neighbouring bubbles from overlapping (relaxation runs)", () => {
    const positions = arrangeOrbitBubbles(600, 400, 6, 150, Array(6).fill(100), 1200, 800);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeGreaterThan(50); // Some minimum separation
      }
    }
  });

  it("handles count=0 without crashing", () => {
    expect(arrangeOrbitBubbles(400, 300, 0, 200, [], 800, 600)).toEqual([]);
  });
});
