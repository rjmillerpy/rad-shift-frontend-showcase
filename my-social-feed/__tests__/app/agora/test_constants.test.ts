import {
  AGORA_TABS,
  BREADCRUMB_PREVIEW_CHARS,
  LIST_ROW_PREVIEW_CHARS,
  POSTS_PER_PAGE,
  REACTION_ACTIONS,
  THREAD_TITLE_PREVIEW_CHARS,
  type AgoraTabKey,
  type ReactionAction,
} from "@/app/agora/constants";
import type { Post } from "@/types/post";

// One fixture per exported type, so `tsc` checks the unions stay in step with the lists.
const defaultTab: AgoraTabKey = "algo";
const everyAction: Record<ReactionAction, keyof Post> = {
  like: "likes",
  laugh: "laughs",
  repost: "reposts",
  save: "saves",
};

describe("AGORA_TABS", () => {
  it("offers the algorithmic feed first, then the following feed", () => {
    expect(AGORA_TABS.map((t) => t.key)).toEqual(["algo", "following"]);
    expect(AGORA_TABS[0].key).toBe(defaultTab);
  });

  it("has unique keys and non-empty, unique labels", () => {
    expect(new Set(AGORA_TABS.map((t) => t.key)).size).toBe(AGORA_TABS.length);
    expect(new Set(AGORA_TABS.map((t) => t.label)).size).toBe(AGORA_TABS.length);
    for (const tab of AGORA_TABS) expect(tab.label.trim()).not.toBe("");
  });
});

describe("paging and truncation limits", () => {
  test.each([
    ["POSTS_PER_PAGE", POSTS_PER_PAGE],
    ["LIST_ROW_PREVIEW_CHARS", LIST_ROW_PREVIEW_CHARS],
    ["THREAD_TITLE_PREVIEW_CHARS", THREAD_TITLE_PREVIEW_CHARS],
    ["BREADCRUMB_PREVIEW_CHARS", BREADCRUMB_PREVIEW_CHARS],
  ])("%s is a positive whole number", (_name, value) => {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
  });

  it("gives the breadcrumb the least room and the thread title the most", () => {
    expect(BREADCRUMB_PREVIEW_CHARS).toBeLessThan(LIST_ROW_PREVIEW_CHARS);
    expect(LIST_ROW_PREVIEW_CHARS).toBeLessThan(THREAD_TITLE_PREVIEW_CHARS);
  });
});

describe("REACTION_ACTIONS", () => {
  it("lists exactly the reactions a post keeps a count for", () => {
    expect(REACTION_ACTIONS.map((r) => r.action).sort()).toEqual(Object.keys(everyAction).sort());
  });

  it("has unique actions and a distinct, non-empty emoji for each", () => {
    expect(new Set(REACTION_ACTIONS.map((r) => r.action)).size).toBe(REACTION_ACTIONS.length);
    expect(new Set(REACTION_ACTIONS.map((r) => r.emoji)).size).toBe(REACTION_ACTIONS.length);
    for (const r of REACTION_ACTIONS) expect(r.emoji.trim()).not.toBe("");
  });

  it("uses lowercase action names, which the API paths are built from", () => {
    for (const r of REACTION_ACTIONS) expect(r.action).toMatch(/^[a-z]+$/);
  });
});
