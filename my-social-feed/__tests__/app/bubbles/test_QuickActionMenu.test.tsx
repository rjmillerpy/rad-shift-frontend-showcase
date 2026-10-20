import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuickActionMenu from "@/app/bubbles/QuickActionMenu";
import type { Post } from "@/types/post";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 42, text: "Hello world", username: "alice",
  likes: 1, reposts: 2, shares: 3, saves: 4, laughs: 5, unix_timestamp: 1700000000,
  ...overrides,
});

const setup = (post: Post = makePost(), x = 120, y = 240) => {
  const onAction = jest.fn();
  const onClose = jest.fn();
  render(<QuickActionMenu post={post} x={x} y={y} onAction={onAction} onClose={onClose} />);
  return { onAction, onClose, post, menu: screen.getByTestId("quick-action-menu") };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("QuickActionMenu", () => {
  it.each([
    ["like", "❤️ Like"],
    ["repost", "🔁 Repost"],
    ["save", "💾 Save"],
    ["laugh", "😂 Laugh"],
    ["share", "🔗 Share"],
    ["quote", "💬 Quote"],
    ["replies", "💭 Replies"],
    ["slop", "🚩 Mark as Slop"],
    ["report", "⚠️ Report"],
  ])("clicking %s reports the action with the post and keeps the menu open", (action, label) => {
    const { onAction, onClose, post } = setup();
    const button = screen.getByTestId(`quick-${action}`);
    expect(button).toHaveTextContent(label);
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(action, post);
    // Inner clicks must not bubble to the click-outside backdrop.
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ["like", "liked_by_me", "❤️ Unlike"],
    ["repost", "reposted_by_me", "🔁 Unrepost"],
    ["save", "saved_by_me", "💾 Unsave"],
    ["laugh", "laughed_by_me", "😂 Unlaugh"],
  ] as const)("%s shows the undo label and a tick only when %s is set", (action, flag, undoLabel) => {
    setup(makePost({ [flag]: true }));
    expect(screen.getByTestId(`quick-${action}`)).toHaveTextContent(undoLabel);
    expect(screen.getByTestId(`${action}-active`)).toHaveTextContent("✓");
    // The other three reactions stay inactive.
    for (const other of ["like", "repost", "save", "laugh"].filter((a) => a !== action)) {
      expect(screen.queryByTestId(`${other}-active`)).not.toBeInTheDocument();
    }
  });

  it("shows no ticks for a post the user has not reacted to", () => {
    const { menu } = setup();
    expect(menu).not.toHaveTextContent("✓");
    expect(menu).not.toHaveTextContent(/Unlike|Unrepost|Unsave|Unlaugh/);
  });

  it.each([
    ["top-left", 0, 0, "0px", "0px"],
    ["at the cursor", 120, 240, "120px", "240px"],
  ])("opens %s at the given coordinates", (_name, x, y, left, top) => {
    const { menu } = setup(makePost(), x, y);
    expect(menu.style.left).toBe(left);
    expect(menu.style.top).toBe(top);
  });

  it("opens the post page and closes when 'Open post' is clicked", () => {
    const { onAction, onClose } = setup();
    fireEvent.click(screen.getByRole("menuitem", { name: "Open post" }));
    expect(mockPush).toHaveBeenCalledWith("/post/42");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("closes on a press outside the menu without triggering an action", () => {
    const { onAction, onClose } = setup();
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("closes on a right-button press outside the menu", () => {
    const { onClose } = setup();
    fireEvent.pointerDown(document.body, { button: 2 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and is a labelled menu of items", () => {
    const { onClose } = setup();
    expect(screen.getByRole("menu", { name: "Post actions" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open on a press inside the menu", () => {
    const { onClose } = setup();
    fireEvent.pointerDown(screen.getByTestId("quick-like"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("highlights a row on hover and clears it on leave", () => {
    setup();
    const button = screen.getByTestId("quick-like");
    fireEvent.mouseEnter(button);
    expect(button.style.background).toContain("rgba(255, 255, 255, 0.1)");
    fireEvent.mouseLeave(button);
    expect(button.style.background).not.toContain("rgba");
  });
});
