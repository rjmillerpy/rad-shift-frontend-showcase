import type {
  MediaMetadata, Post, PostLinkCard, PostMetadata, PostSourceMetadata, QuotedPost, WidgetInfo,
} from "@/types/post";

// `src/types/post.ts` exports only types, so these fixtures exist for `tsc` to check the
// shapes; the runtime assertions pin down what a consumer may and may not rely on.
const source: PostSourceMetadata = { platform: "reddit", name: "r/python", url: "https://reddit.com/r/python", label: "Reddit · r/python" };
const linkCard: PostLinkCard = { url: "https://youtu.be/abc", title: "Demo", image: "https://img.example/t.jpg", hostname: "youtu.be", is_video: true };
const metadata: PostMetadata = { tags: ["python", "news"], tagged_users: ["bob"], location: "Leeds", source, link_card: linkCard };
const quoted: QuotedPost = { id: 7, username: "carol", text: "original" };
const media: MediaMetadata = { duration_seconds: 12.5, bitrate: 128000, sample_rate: 44100, dimensions: { width: 1920, height: 1080 }, format: "mp4", type: "video" };

const minimalPost: Post = { id: 1, text: "hello", username: "alice", likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1759622400 };

const fullPost: Post = {
  ...minimalPost,
  id: 2,
  profile_picture_url: null,
  image_url: "https://img.example/a.jpg",
  image_urls: ["https://img.example/a.jpg", "https://img.example/b.jpg"],
  video_url: null,
  audio_url: null,
  document_urls: null,
  post_metadata: metadata,
  liked_by_me: true,
  reposted_by_me: false,
  is_followed_by_me: true,
  is_me: false,
  likes: 5,
  laughed_by_me: false,
  replies_count: 3,
  quotes_count: 1,
  slop_count: 0,
  reposted_by: ["dave"],
  saved_by_me: true,
  parent_post_id: 1,
  media_metadata: media,
  quoted_post: quoted,
};

const widget: WidgetInfo = {
  id: 3, title: "Clock", description: null, category: "tool", language: "javascript", icon_emoji: null,
  author_username: "alice", status: "approved", install_count: 12, likes: 4, saves: 1, rating_avg: null,
  default_width: 400, default_height: 300, resizable: true, tags: null, permissions: ["network"],
};

describe("Post", () => {
  it("needs only identity, author, counters and timestamp", () => {
    expect(Object.keys(minimalPost).sort()).toEqual(
      ["id", "laughs", "likes", "reposts", "saves", "shares", "text", "unix_timestamp", "username"],
    );
    expect(minimalPost.post_metadata?.tags ?? []).toEqual([]);
    expect(minimalPost.quoted_post ?? null).toBeNull();
  });

  it("carries a timestamp in seconds, not milliseconds", () => {
    expect(new Date(fullPost.unix_timestamp * 1000).getUTCFullYear()).toBe(2025);
  });

  it("round-trips through JSON as the API sends it, including explicit nulls", () => {
    const parsed: Post = JSON.parse(JSON.stringify(fullPost));
    expect(parsed).toEqual(fullPost);
    expect(parsed.video_url).toBeNull();
    expect(parsed.parent_post_id).toBe(minimalPost.id);
  });

  it("nests metadata, media and quoted post", () => {
    expect(fullPost.post_metadata?.source?.label).toBe("Reddit · r/python");
    expect(fullPost.post_metadata?.link_card?.is_video).toBe(true);
    expect(fullPost.media_metadata?.dimensions).toEqual({ width: 1920, height: 1080 });
    expect(fullPost.quoted_post?.username).toBe("carol");
    expect(fullPost.image_urls).toContain(fullPost.image_url);
  });
});

describe("supporting post types", () => {
  it.each<[string, PostSourceMetadata, boolean]>([
    ["with a url", source, true],
    ["with a null url", { platform: "web", name: "Hacker News", url: null, label: "Hacker News" }, false],
    ["without a url", { platform: "web", name: "Hacker News", label: "Hacker News" }, false],
  ])("PostSourceMetadata %s has a label to render and is linkable only with a url", (_label, value, linkable) => {
    expect(value.label).not.toBe("");
    expect(Boolean(value.url)).toBe(linkable);
  });

  it("PostLinkCard needs only a url", () => {
    const bare: PostLinkCard = { url: "https://example.com" };
    expect(bare.is_video ?? false).toBe(false);
    expect(new URL(bare.url).hostname).toBe("example.com");
  });

  it.each<[string, MediaMetadata, string]>([
    ["audio", { duration_seconds: 180, bitrate: 320000, sample_rate: 48000, dimensions: null, format: "mp3", type: "audio" }, "3:00"],
    ["video", media, "0:12"],
    ["media with nothing probed", {}, "0:00"],
  ])("MediaMetadata for %s yields a displayable duration", (_label, value, expected) => {
    const seconds = Math.floor(value.duration_seconds ?? 0);
    expect(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`).toBe(expected);
    expect(value.dimensions?.width ?? 0).toBe(value.type === "video" ? 1920 : 0);
  });
});

describe("WidgetInfo", () => {
  it("allows the nullable store fields to be null", () => {
    const nullable = (["description", "icon_emoji", "rating_avg", "tags"] as const).map((key) => widget[key]);
    expect(nullable).toEqual([null, null, null, null]);
    expect(widget.permissions).toEqual(["network"]);
  });

  it("has positive default dimensions for the iframe", () => {
    expect(widget.default_width).toBeGreaterThan(0);
    expect(widget.default_height).toBeGreaterThan(0);
  });
});
