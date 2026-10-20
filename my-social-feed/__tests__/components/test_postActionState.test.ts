import { postActionState } from "@/components/postActionState";
import type { Post } from "@/types/post";

const base = {
  id: 9, username: "bob", likes: 3, reposts: 2, shares: 1, saves: 4,
  liked_by_me: true, reposted_by_me: false, saved_by_me: true, laughed_by_me: false,
  post_metadata: {},
} as unknown as Post;

describe("postActionState", () => {
  it("reads identity, viewer flags and counts from the post", () => {
    const state = postActionState({ ...base, laughs: 5, replies_count: 6, quotes_count: 7, slop_count: 8 } as Post);
    expect(state).toMatchObject({
      postId: 9,
      posterUsername: "bob",
      likedByMe: true,
      savedByMe: true,
      captureElementId: "post-9",
      counts: { likes: 3, reposts: 2, shares: 1, saves: 4, laughs: 5, replies: 6, quotes: 7, slop: 8 },
    });
  });

  it("counts missing optional numbers as zero", () => {
    expect(postActionState(base).counts).toMatchObject({ laughs: 0, replies: 0, quotes: 0, slop: 0 });
  });

  it("passes media URLs through, and empty ones as undefined", () => {
    expect(postActionState({ ...base, video_url: "v.mp4", audio_url: "" } as Post)).toMatchObject({
      videoUrl: "v.mp4",
      audioUrl: undefined,
    });
  });

  it.each([
    [{ tags: ["a"] }, true],
    [{ location: "Chicago" }, true],
    [{}, false],
  ])("hasMetadata for %j is %s", (post_metadata, expected) => {
    expect(postActionState({ ...base, post_metadata } as Post).hasMetadata).toBe(expected);
  });
});
