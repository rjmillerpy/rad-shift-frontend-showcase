import { renderHook, act } from "@testing-library/react";
import { cellRawValue, useLedgerEditing } from "@/app/ledger/useLedgerEditing";
import type { LedgerRow } from "@/app/ledger/types";
import type { Post } from "@/types/post";

function makeRow(overrides: Partial<Post> = {}): LedgerRow {
  const post = {
    id: 1, text: "hi there", username: "alice",
    profile_picture_url: null, image_url: null, image_urls: [], video_url: null, audio_url: null,
    document_urls: [], likes: 3, laughs: 0, shares: 0, reposts: 1, saves: 0,
    liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
    is_followed_by_me: false, is_me: false, unix_timestamp: 1_700_000_000,
    replies_count: 0, quotes_count: 0, slop_count: 0,
    reposted_by: null, quoted_post: null, media_metadata: null, post_metadata: {},
    ...overrides,
  } as Post;
  return {
    post,
    rawName: post.username,
    rawText: post.text,
    displayName: post.username,
    displayText: post.text,
    displayLikes: post.likes ?? 0,
    displayReposts: post.reposts ?? 0,
    mediaKind: "text",
    displayWhen: "1h ago",
  };
}

describe("cellRawValue", () => {
  it.each<["A" | "B" | "C" | "D" | "E" | "F", string]>([
    ["A", "alice"], ["B", "hi there"], ["C", "3"], ["D", "1"], ["E", "text"], ["F", "1h ago"],
  ])("column %s returns %s", (col, expected) => {
    expect(cellRawValue(makeRow(), col)).toBe(expected);
  });

  it("returns empty string for missing row", () => {
    expect(cellRawValue(undefined, "A")).toBe("");
  });
});

describe("useLedgerEditing", () => {
  it("starts with no active edit", () => {
    const { result } = renderHook(() => useLedgerEditing({ rows: [makeRow()], resetKey: "algo" }));
    expect(result.current.editing).toBeNull();
    expect(result.current.editDraft).toBe("");
  });

  it("startEdit on a content column pre-fills with the raw value", () => {
    const { result } = renderHook(() => useLedgerEditing({ rows: [makeRow()], resetKey: "algo" }));
    act(() => { result.current.startEdit(0, "B"); });
    expect(result.current.editing).toEqual({ row: 0, col: "B" });
    expect(result.current.editDraft).toBe("hi there");
  });

  it("startEdit on a padding column starts empty", () => {
    const { result } = renderHook(() => useLedgerEditing({ rows: [makeRow()], resetKey: "algo" }));
    act(() => { result.current.startEdit(0, "H"); });
    expect(result.current.editDraft).toBe("");
  });

  it("commit saves the draft and clears the editing coord", () => {
    const { result } = renderHook(() => useLedgerEditing({ rows: [makeRow()], resetKey: "algo" }));
    act(() => { result.current.startEdit(0, "B"); });
    act(() => { result.current.setEditDraft("new value"); });
    act(() => { result.current.commitEdit(); });
    expect(result.current.editing).toBeNull();
    expect(result.current.getEdit(0, "B")).toBe("new value");
  });

  it("sanitizes profanity on commit so saved edits are SFW", () => {
    const { result } = renderHook(() => useLedgerEditing({ rows: [makeRow()], resetKey: "algo" }));
    act(() => { result.current.startEdit(0, "B"); });
    act(() => { result.current.setEditDraft("what the fuck is this"); });
    act(() => { result.current.commitEdit(); });
    const saved = result.current.getEdit(0, "B") ?? "";
    expect(saved).not.toMatch(/fuck/i);
    expect(saved).toMatch(/#/);
  });

  it("cancel drops the draft without saving", () => {
    const { result } = renderHook(() => useLedgerEditing({ rows: [makeRow()], resetKey: "algo" }));
    act(() => { result.current.startEdit(0, "B"); });
    act(() => { result.current.setEditDraft("junk"); });
    act(() => { result.current.cancelEdit(); });
    expect(result.current.editing).toBeNull();
    expect(result.current.getEdit(0, "B")).toBeUndefined();
  });

  it("resetKey change wipes all edits", () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useLedgerEditing({ rows: [makeRow()], resetKey: key }),
      { initialProps: { key: "algo" } },
    );
    act(() => { result.current.startEdit(0, "B"); });
    act(() => { result.current.setEditDraft("v"); });
    act(() => { result.current.commitEdit(); });
    expect(result.current.getEdit(0, "B")).toBe("v");
    rerender({ key: "drafts" });
    expect(result.current.getEdit(0, "B")).toBeUndefined();
  });
});
