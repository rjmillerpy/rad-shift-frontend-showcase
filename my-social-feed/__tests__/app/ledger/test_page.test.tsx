/**
 * Integration test for /ledger page — orchestrates the ribbon, grid,
 * formula bar, sheet tabs, status bar, and right-click context menu.
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import api from "@/lib/api";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import LedgerPage from "@/app/ledger/page";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1, text: "hello", username: "alice",
    profile_picture_url: null, image_url: null, image_urls: [], video_url: null, audio_url: null,
    document_urls: [], likes: 10, laughs: 0, shares: 0, reposts: 2, saves: 0,
    liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
    is_followed_by_me: false, is_me: false, unix_timestamp: 1_700_000_000,
    replies_count: 0, quotes_count: 0, slop_count: 0,
    reposted_by: null, quoted_post: null, media_metadata: null, post_metadata: {},
    ...overrides,
  } as Post;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "t");
});

async function renderLedger(posts: Post[]) {
  mockedApi.get.mockResolvedValue({ data: { posts } });
  render(<LedgerPage />);
  await waitFor(() => {
    // Wait for at least one row or the empty message.
    const rows = screen.queryAllByTestId(/^ledger-row-\d+$/);
    expect(rows.length > 0 || !!screen.queryByTestId("ledger-empty")).toBe(true);
  });
}

describe("LedgerPage", () => {
  it("renders the title bar, ribbon, formula bar, sheet tabs, and status bar", async () => {
    await renderLedger([makePost()]);
    expect(screen.getByTestId("ledger-title-bar")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-ribbon")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-formula-bar")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-sheet-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-status-bar")).toBeInTheDocument();
  });

  it("shows fetched posts as rows", async () => {
    await renderLedger([
      makePost({ id: 1, username: "alice", text: "hi", likes: 5 }),
      makePost({ id: 2, username: "bob", text: "hey", likes: 3 }),
    ]);
    expect(screen.getByTestId("ledger-cell-0-A").textContent).toBe("alice");
    expect(screen.getByTestId("ledger-cell-1-A").textContent).toBe("bob");
  });

  it("shows the empty message when no posts", async () => {
    await renderLedger([]);
    expect(screen.getByTestId("ledger-empty")).toBeInTheDocument();
  });

  it("filters by search input", async () => {
    await renderLedger([
      makePost({ id: 1, username: "alice", text: "cats" }),
      makePost({ id: 2, username: "bob", text: "dogs" }),
    ]);
    fireEvent.change(screen.getByTestId("ledger-search"), { target: { value: "cat" } });
    await waitFor(() => {
      expect(screen.getAllByTestId(/^ledger-row-\d+$/)).toHaveLength(1);
      expect(screen.getByTestId("ledger-cell-0-A").textContent).toBe("alice");
    });
  });

  it("sorts by most-liked when changing the sort dropdown", async () => {
    await renderLedger([
      makePost({ id: 1, username: "alice", text: "one", likes: 1 }),
      makePost({ id: 2, username: "bob", text: "two", likes: 50 }),
    ]);
    fireEvent.change(screen.getByTestId("ledger-sort"), { target: { value: "likes" } });
    await waitFor(() => {
      const rows = screen.getAllByTestId(/^ledger-row-\d+$/);
      // First row should be bob (50 likes).
      expect(rows[0].textContent).toContain("bob");
    });
  });

  it("switches sheets via the bottom tabs", async () => {
    await renderLedger([makePost()]);
    // Following requires auth (localStorage token set in beforeEach).
    mockedApi.get.mockResolvedValueOnce({ data: { posts: [makePost({ id: 99, username: "followed" })] } });
    fireEvent.click(screen.getByTestId("ledger-sheet-following"));
    await waitFor(() => {
      expect(screen.getByTestId("ledger-cell-0-A").textContent).toBe("followed");
    });
  });

  it("clicking a cell updates the formula bar coordinate", async () => {
    await renderLedger([makePost({ id: 7, username: "alice", text: "hi" })]);
    fireEvent.click(screen.getByTestId("ledger-cell-0-B"));
    expect(screen.getByTestId("ledger-name-box").textContent).toBe("B1");
  });

  it("double-clicking a cell puts it in edit mode with the raw value", async () => {
    await renderLedger([makePost({ id: 42, username: "alice", text: "hi there" })]);
    fireEvent.doubleClick(screen.getByTestId("ledger-cell-0-B"));
    // An input should now be rendered pre-filled with the raw post text.
    expect(screen.getByDisplayValue("hi there")).toBeInTheDocument();
  });

  it("edits commit on Enter and the cell shows the new value", async () => {
    await renderLedger([makePost({ id: 1, username: "alice", text: "old" })]);
    fireEvent.doubleClick(screen.getByTestId("ledger-cell-0-B"));
    const input = screen.getByDisplayValue("old");
    fireEvent.change(input, { target: { value: "brand new value" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByTestId("ledger-cell-0-B").textContent).toBe("brand new value");
    });
  });

  it("Escape cancels an edit without saving", async () => {
    await renderLedger([makePost({ id: 1, username: "alice", text: "keep me" })]);
    fireEvent.doubleClick(screen.getByTestId("ledger-cell-0-B"));
    const input = screen.getByDisplayValue("keep me");
    fireEvent.change(input, { target: { value: "not saved" } });
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(screen.getByTestId("ledger-cell-0-B").textContent).toBe("keep me");
    });
  });

  it("right-clicking opens the quick-action menu, click-outside closes it", async () => {
    await renderLedger([makePost({ id: 1 })]);
    fireEvent.contextMenu(screen.getByTestId("ledger-row-0"), { clientX: 100, clientY: 200 });
    const menu = await screen.findByTestId("quick-action-menu");
    expect(menu).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByTestId("quick-action-menu")).not.toBeInTheDocument());
  });

  it("logs a warning if the fetch fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedApi.get.mockRejectedValue(new Error("network"));
    render(<LedgerPage />);
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });

  it("zoom slider updates the status bar zoom label", async () => {
    await renderLedger([makePost()]);
    fireEvent.change(screen.getByTestId("ledger-zoom-slider"), { target: { value: "150" } });
    expect(screen.getByTestId("ledger-status-zoom").textContent).toBe("150%");
  });

  it("shows a Load-more button when more than 25 posts and reveals them on click", async () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      makePost({ id: i + 1, username: `u${i}`, unix_timestamp: 1_700_000_000 - i }),
    );
    await renderLedger(many);
    // Initially only 25 rows visible.
    expect(screen.getAllByTestId(/^ledger-row-\d+$/)).toHaveLength(25);
    const loadMore = screen.getByTestId("ledger-load-more");
    expect(loadMore).toBeInTheDocument();
    fireEvent.click(loadMore);
    await waitFor(() => {
      expect(screen.getAllByTestId(/^ledger-row-\d+$/)).toHaveLength(30);
    });
    // No more button when we've caught up.
    expect(screen.queryByTestId("ledger-load-more")).not.toBeInTheDocument();
  });

  it("shows a toast when a fake ribbon button is clicked", async () => {
    await renderLedger([makePost()]);
    fireEvent.click(screen.getByTestId("ledger-fun-save"));
    expect(screen.getByTestId("ledger-fun-toast").textContent).toMatch(/Autosaved/);
  });
});
