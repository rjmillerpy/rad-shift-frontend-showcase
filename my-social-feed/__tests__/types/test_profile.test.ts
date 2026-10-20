import type { Post } from "@/types/post";
import type { Profile } from "@/types/profile";

// `src/types/profile.ts` exports only a type, so the fixtures exist for `tsc` to check the shape.
const post = (id: number, username: string): Post => ({
  id, text: `post ${id}`, username, likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1759622400 + id,
});

describe("Profile", () => {
  it("needs only a username and a (possibly empty) list of posts", () => {
    const profile: Profile = { username: "newbie", posts: [] };
    expect(Object.keys(profile).sort()).toEqual(["posts", "username"]);
    expect(profile.bio ?? "").toBe("");
    expect(profile.profile_picture_url).toBeUndefined();
  });

  it("holds full Post objects that a profile page can sort and attribute", () => {
    const profile: Profile = {
      username: "alice",
      bio: "Writes about Python.",
      profile_picture_url: "https://img.example/alice.jpg",
      posts: [post(1, "alice"), post(3, "alice"), post(2, "alice")],
    };
    const newestFirst = [...profile.posts].sort((a, b) => b.unix_timestamp - a.unix_timestamp);
    expect(newestFirst.map((p) => p.id)).toEqual([3, 2, 1]);
    expect(profile.posts.every((p) => p.username === profile.username)).toBe(true);
  });

  it("round-trips through JSON as the API sends it", () => {
    const profile: Profile = { username: "bob", bio: "hi", posts: [post(1, "bob")] };
    const parsed: Profile = JSON.parse(JSON.stringify(profile));
    expect(parsed).toEqual(profile);
  });
});
