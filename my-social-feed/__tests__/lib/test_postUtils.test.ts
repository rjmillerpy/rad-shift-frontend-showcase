import { normalizePost, normalizePosts, type ApiPost } from "@/lib/postUtils";

describe("normalizePost", () => {
  it("maps is_saved_by_me to saved_by_me", () => {
    const raw = { id: 1, text: "hi", is_saved_by_me: true } as ApiPost;
    expect(normalizePost(raw).saved_by_me).toBe(true);
  });

  it("preserves saved_by_me when already present", () => {
    const raw = { id: 1, text: "hi", saved_by_me: true } as ApiPost;
    expect(normalizePost(raw).saved_by_me).toBe(true);
  });

  it("defaults saved_by_me to false when neither field exists", () => {
    const raw = { id: 1, text: "hi" } as ApiPost;
    expect(normalizePost(raw).saved_by_me).toBe(false);
  });

  it("prefers saved_by_me over is_saved_by_me", () => {
    const raw = { id: 1, text: "hi", saved_by_me: false, is_saved_by_me: true } as ApiPost;
    expect(normalizePost(raw).saved_by_me).toBe(false);
  });

  it("preserves all other post fields", () => {
    const raw = { id: 42, text: "hello", username: "bob", likes: 5 } as ApiPost;
    const result = normalizePost(raw);
    expect(result.id).toBe(42);
    expect(result.text).toBe("hello");
    expect(result.username).toBe("bob");
    expect(result.likes).toBe(5);
  });
});

describe("normalizePosts", () => {
  it("normalizes an array of posts", () => {
    const raw = [
      { id: 1, text: "a", is_saved_by_me: true },
      { id: 2, text: "b", saved_by_me: false },
    ] as ApiPost[];
    const result = normalizePosts(raw);
    expect(result).toHaveLength(2);
    expect(result[0].saved_by_me).toBe(true);
    expect(result[1].saved_by_me).toBe(false);
  });

  it("handles empty array", () => {
    expect(normalizePosts([])).toEqual([]);
  });

  it("handles null/undefined gracefully", () => {
    expect(normalizePosts(null as any)).toEqual([]);
    expect(normalizePosts(undefined as any)).toEqual([]);
  });
});
