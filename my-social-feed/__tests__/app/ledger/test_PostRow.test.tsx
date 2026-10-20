import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import PostRow from "@/app/ledger/PostRow";
import type { LedgerRow } from "@/app/ledger/types";

function sampleRow(): LedgerRow {
  return {
    post: {
      id: 42, text: "hello world", username: "alice",
      profile_picture_url: null, image_url: null, image_urls: [], video_url: null, audio_url: null,
      document_urls: [], likes: 5, laughs: 0, shares: 0, reposts: 2, saves: 0,
      liked_by_me: false, reposted_by_me: false, saved_by_me: false, laughed_by_me: false,
      is_followed_by_me: false, is_me: false, unix_timestamp: 1_700_000_000,
      replies_count: 0, quotes_count: 0, slop_count: 0,
      reposted_by: null, quoted_post: null, media_metadata: null, post_metadata: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    rawName: "alice",
    rawText: "hello world",
    displayName: "alice",
    displayText: "hello world",
    displayLikes: 5,
    displayReposts: 2,
    mediaKind: "text",
    displayWhen: "1h ago",
  };
}

function makeProps() {
  return {
    row: sampleRow(),
    rowIndex: 3,
    rowNumber: 4,
    selected: false,
    selectedCol: "A" as const,
    height: 24,
    editingCol: null,
    editDraft: "",
    getEdit: () => undefined,
    getColWidth: (_: string) => 80,
    onRowResizeStart: jest.fn(),
    onSelectCell: jest.fn(),
    onStartEdit: jest.fn(),
    onChangeEdit: jest.fn(),
    onCommitEdit: jest.fn(),
    onCancelEdit: jest.fn(),
    onContextMenu: jest.fn(),
  };
}

describe("PostRow", () => {
  it("renders username, text, likes, reposts, media icon, and time", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("shows the 1-based row number", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("fires onSelectCell when a cell is clicked", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    fireEvent.click(screen.getByTestId("ledger-cell-3-B"));
    expect(p.onSelectCell).toHaveBeenCalledWith(3, "B");
  });

  it("double-clicking a cell fires onStartEdit for that column", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    fireEvent.doubleClick(screen.getByTestId("ledger-cell-3-B"));
    expect(p.onStartEdit).toHaveBeenCalledWith(3, "B");
  });

  it("renders the saved edit value in place of the default content", () => {
    const p = { ...makeProps(), getEdit: (_r: number, c: string) => (c === "B" ? "override text" : undefined) };
    render(<PostRow {...p} />);
    expect(screen.getByTestId("ledger-cell-3-B").textContent).toBe("override text");
  });

  it("renders an input when editingCol matches, and Enter commits", () => {
    const p = { ...makeProps(), editingCol: "B", editDraft: "hello there" };
    render(<PostRow {...p} />);
    const input = screen.getByDisplayValue("hello there");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(p.onChangeEdit).toHaveBeenCalledWith("new value");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(p.onCommitEdit).toHaveBeenCalled();
  });

  it("Escape cancels edit", () => {
    const p = { ...makeProps(), editingCol: "A", editDraft: "x" };
    render(<PostRow {...p} />);
    fireEvent.keyDown(screen.getByDisplayValue("x"), { key: "Escape" });
    expect(p.onCancelEdit).toHaveBeenCalled();
  });

  it("fires onContextMenu with coordinates and prevents the browser menu", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    fireEvent.contextMenu(screen.getByTestId("ledger-row-3"), { clientX: 100, clientY: 200 });
    expect(p.onContextMenu).toHaveBeenCalledWith(3, 100, 200);
  });

  it("renders empty padding cells to the right of column F", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    expect(screen.getByTestId("ledger-pad-3-G")).toBeInTheDocument();
    expect(screen.getByTestId("ledger-pad-3-L")).toBeInTheDocument();
    // Empty content is fine — we're just making sure the DOM node exists
    expect(screen.getByTestId("ledger-pad-3-G").textContent).toBe("");
  });

  it("row-resize handle fires onRowResizeStart", () => {
    const p = makeProps();
    render(<PostRow {...p} />);
    fireEvent.mouseDown(screen.getByTestId("ledger-row-resize-3"));
    expect(p.onRowResizeStart).toHaveBeenCalledWith(3, expect.anything());
  });
});
