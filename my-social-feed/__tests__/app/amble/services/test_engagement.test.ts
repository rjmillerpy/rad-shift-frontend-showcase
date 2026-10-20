/**
 * Phase 1.5 engagement client tests — verify the client maps the existing
 * `/posts/{action}/{post_id}` response shape into flat frontend state
 * and dispatches the AMBLE_ENGAGEMENT_EVENT so the HUD counter can react.
 */
import { toggleLike, toggleRepost, toggleSave } from "@/app/amble/services/engagement";
import api from "@/lib/api";
import { AMBLE_ENGAGEMENT_EVENT } from "@/app/amble/data/constants";

jest.mock("@/lib/api");

const mockedPost = api.post as jest.MockedFunction<typeof api.post>;

describe("engagement client", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it("toggleLike maps { likes, action: 'liked' } to { likes, liked_by_me: true }", async () => {
    mockedPost.mockResolvedValueOnce({ data: { likes: 4, action: "liked" } });
    const result = await toggleLike(42);
    expect(result).toEqual({ likes: 4, liked_by_me: true });
    expect(mockedPost).toHaveBeenCalledWith("/posts/like/42");
  });

  it("toggleLike maps 'unliked' back to liked_by_me: false", async () => {
    mockedPost.mockResolvedValueOnce({ data: { likes: 3, action: "unliked" } });
    const result = await toggleLike(7);
    expect(result.liked_by_me).toBe(false);
    expect(result.likes).toBe(3);
  });

  it("toggleRepost recognises 're-posted' as the truthy action string", async () => {
    mockedPost.mockResolvedValueOnce({ data: { reposts: 1, action: "re-posted" } });
    const result = await toggleRepost(9);
    expect(result).toEqual({ reposts: 1, reposted_by_me: true });
    expect(mockedPost).toHaveBeenCalledWith("/posts/repost/9");
  });

  it("toggleSave maps 'saved' to saved_by_me: true", async () => {
    mockedPost.mockResolvedValueOnce({ data: { saves: 2, action: "saved" } });
    const result = await toggleSave(11);
    expect(result).toEqual({ saves: 2, saved_by_me: true });
    expect(mockedPost).toHaveBeenCalledWith("/posts/save/11");
  });

  it("dispatches AMBLE_ENGAGEMENT_EVENT on success so the HUD counter fires", async () => {
    mockedPost.mockResolvedValueOnce({ data: { likes: 1, action: "liked" } });
    const listener = jest.fn();
    window.addEventListener(AMBLE_ENGAGEMENT_EVENT, listener);
    await toggleLike(100);
    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ kind: "like", postId: 100 });
    window.removeEventListener(AMBLE_ENGAGEMENT_EVENT, listener);
  });

  it("propagates errors from the underlying api.post", async () => {
    mockedPost.mockRejectedValueOnce(new Error("network"));
    await expect(toggleLike(1)).rejects.toThrow("network");
  });
});
