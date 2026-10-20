/**
 * EngagementBar renders like / repost / save for one post. Only the HTTP
 * client behind services/engagement (`@/lib/api`) is mocked.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import EngagementBar from "@/app/amble/ui/EngagementBar";
import type { AmblePost } from "@/app/amble/data/schema";
import api from "@/lib/api";

jest.mock("@/lib/api");

const mockedPost = api.post as jest.MockedFunction<typeof api.post>;
const ACTIVE_COLOR = "rgb(249, 199, 79)"; // #f9c74f

const makePost = (overrides: Partial<AmblePost> = {}): AmblePost => ({
  id: 42, author: "jrome", text: "hello", unix_timestamp: 1_700_000_100,
  likes: 5, reposts: 2, saves: 1, liked_by_me: false, reposted_by_me: false,
  ...overrides,
});

type Deferred = { resolve: (data: unknown) => void; reject: (error: unknown) => void };

/** Queue one api.post response that the test settles by hand. */
function deferNextRequest(): Deferred {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  mockedPost.mockReturnValueOnce(promise as ReturnType<typeof api.post>);
  return { resolve: (data) => resolve({ data }), reject };
}

const button = (kind: string) => screen.getByTestId(`amble-engagement-${kind}`);
const isActive = (kind: string) => button(kind).style.color === ACTIVE_COLOR;
const settle = (fn: () => void) => act(async () => { fn(); });

// kind, off glyph, on glyph, count field in the response, action that means "on"
const KINDS = [
  ["like", "♡", "♥", "likes", "liked"],
  ["repost", "↺", "↻", "reposts", "re-posted"],
  ["save", "☆", "★", "saves", "saved"],
] as const;

describe("EngagementBar", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockedPost.mockReset();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("shows the post's counts with nothing active for an untouched post", () => {
    render(<EngagementBar post={makePost()} />);
    expect(button("like")).toHaveTextContent("♡5");
    expect(button("repost")).toHaveTextContent("↺2");
    expect(button("save")).toHaveTextContent("☆1");
    expect(KINDS.map(([kind]) => isActive(kind))).toEqual([false, false, false]);
    for (const [kind] of KINDS) expect(button(kind)).toBeEnabled();
  });

  it("starts like and repost active from the post's by-me flags", () => {
    render(<EngagementBar post={makePost({ liked_by_me: true, reposted_by_me: true })} />);
    expect(button("like")).toHaveTextContent("♥5");
    expect(button("repost")).toHaveTextContent("↻2");
    // AmblePost carries no saved-by-me flag, so save always starts inactive.
    expect(button("save")).toHaveTextContent("☆1");
    expect(KINDS.map(([kind]) => isActive(kind))).toEqual([true, true, false]);
  });

  it.each(KINDS)(
    "%s: posts to the endpoint, disables while pending, then shows the server's answer",
    async (kind, _off, on, countField, onAction) => {
      render(<EngagementBar post={makePost()} />);
      const request = deferNextRequest();

      fireEvent.click(button(kind));

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost).toHaveBeenCalledWith(`/posts/${kind}/42`);
      expect(button(kind)).toBeDisabled();
      expect(isActive(kind)).toBe(false);

      await settle(() => request.resolve({ [countField]: 99, action: onAction }));

      expect(button(kind)).toHaveTextContent(`${on}99`);
      expect(isActive(kind)).toBe(true);
      expect(button(kind)).toBeEnabled();
    },
  );

  it.each(KINDS)("%s: toggles back off when the server says so", async (kind, off, _on, countField) => {
    render(<EngagementBar post={makePost({ liked_by_me: true, reposted_by_me: true })} />);
    const request = deferNextRequest();

    fireEvent.click(button(kind));
    await settle(() => request.resolve({ [countField]: 0, action: "removed" }));

    expect(button(kind)).toHaveTextContent(`${off}0`);
    expect(isActive(kind)).toBe(false);
  });

  it.each(KINDS)("%s: a failed request keeps the last confirmed state", async (kind, _off, on, countField, onAction) => {
    render(<EngagementBar post={makePost()} />);
    const confirmed = deferNextRequest();
    fireEvent.click(button(kind));
    await settle(() => confirmed.resolve({ [countField]: 8, action: onAction }));

    const failing = deferNextRequest();
    fireEvent.click(button(kind));
    expect(button(kind)).toBeDisabled();
    await settle(() => failing.reject(new Error("offline")));

    expect(button(kind)).toHaveTextContent(`${on}8`);
    expect(isActive(kind)).toBe(true);
    expect(button(kind)).toBeEnabled();
    expect(consoleError).toHaveBeenCalledWith(`amble ${kind} failed`, expect.any(Error));
  });

  it("only touches the engagement kind that was clicked", async () => {
    render(<EngagementBar post={makePost()} />);
    const request = deferNextRequest();
    fireEvent.click(button("repost"));
    await settle(() => request.resolve({ reposts: 3, action: "re-posted" }));

    expect(button("like")).toHaveTextContent("♡5");
    expect(button("repost")).toHaveTextContent("↻3");
    expect(button("save")).toHaveTextContent("☆1");
  });

  it("ignores other clicks while a request is in flight", async () => {
    render(<EngagementBar post={makePost()} />);
    const request = deferNextRequest();

    fireEvent.click(button("like"));
    fireEvent.click(button("repost"));
    fireEvent.click(button("save"));
    expect(mockedPost).toHaveBeenCalledTimes(1);

    await settle(() => request.resolve({ likes: 6, action: "liked" }));
    const next = deferNextRequest();
    fireEvent.click(button("save"));
    expect(mockedPost).toHaveBeenLastCalledWith("/posts/save/42");
    await settle(() => next.resolve({ saves: 2, action: "saved" }));
    expect(button("save")).toHaveTextContent("★2");
  });

  it("resets to the new post's values when the post prop changes", async () => {
    const { rerender } = render(<EngagementBar post={makePost()} />);
    for (const [kind, , , countField, onAction] of KINDS) {
      const request = deferNextRequest();
      fireEvent.click(button(kind));
      await settle(() => request.resolve({ [countField]: 50, action: onAction }));
    }
    expect(KINDS.map(([kind]) => isActive(kind))).toEqual([true, true, true]);

    rerender(<EngagementBar post={makePost({ id: 43, likes: 0, reposts: 7, saves: 9, reposted_by_me: true })} />);

    expect(button("like")).toHaveTextContent("♡0");
    expect(button("repost")).toHaveTextContent("↻7");
    expect(button("save")).toHaveTextContent("☆9");
    expect(KINDS.map(([kind]) => isActive(kind))).toEqual([false, true, false]);

    const request = deferNextRequest();
    fireEvent.click(button("like"));
    expect(mockedPost).toHaveBeenLastCalledWith("/posts/like/43");
    await settle(() => request.resolve({ likes: 1, action: "liked" }));
    expect(button("like")).toHaveTextContent("♥1");
  });

  // KNOWN ISSUE: a response for the previous post that lands after the post
  // prop changed is applied to the new post's counters (no post-id guard).
  it.failing("does not apply a late response from the previous post to the new post", async () => {
    const { rerender } = render(<EngagementBar post={makePost()} />);
    const stale = deferNextRequest();
    fireEvent.click(button("like"));

    rerender(<EngagementBar post={makePost({ id: 43, likes: 0 })} />);
    await settle(() => stale.resolve({ likes: 6, action: "liked" }));

    expect(button("like")).toHaveTextContent("♡0");
  });
});
