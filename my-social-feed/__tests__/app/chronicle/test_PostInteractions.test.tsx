import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import { ContextMenu, PostTooltip } from "@/app/chronicle/PostInteractions";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children);
  return { __esModule: true, default: MockLink };
});

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 42, text: "Hello", username: "alice",
  likes: 11, reposts: 0, shares: 0, saves: 33, laughs: 22, unix_timestamp: 1700000000,
  ...overrides,
});

const writeText = jest.fn();
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const originalInnerWidth = window.innerWidth;
let alertSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1000 });
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  alertSpy.mockRestore();
  errorSpy.mockRestore();
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: originalInnerWidth });
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("PostTooltip", () => {
  const setup = (post: Post = makePost(), x = 100, y = 300) => {
    const onReact = jest.fn();
    const onClose = jest.fn();
    render(<PostTooltip post={post} x={x} y={y} onReact={onReact} onClose={onClose} />);
    return { onReact, onClose, tip: screen.getByTestId("post-tooltip") };
  };

  it("links to the author's profile and to the post", () => {
    setup();
    expect(screen.getByRole("link", { name: "@alice" })).toHaveAttribute("href", "/profile/alice");
    expect(screen.getByRole("link", { name: "view →" })).toHaveAttribute("href", "/post/42");
  });

  it.each([
    ["like", "11"],
    ["laugh", "22"],
    ["save", "33"],
  ])("the %s button shows its count (%s) and reports the reaction", (action, count) => {
    const { onReact, onClose } = setup();
    const button = screen.getByTestId(`tooltip-${action}`);
    expect(button).toHaveTextContent(count);
    fireEvent.click(button);
    expect(onReact).toHaveBeenCalledTimes(1);
    expect(onReact).toHaveBeenCalledWith(42, action);
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ["like", "liked_by_me"],
    ["laugh", "laughed_by_me"],
    ["save", "saved_by_me"],
  ] as const)("the %s button is vivid only when %s is set", (action, flag) => {
    setup(makePost({ [flag]: true }));
    for (const other of ["like", "laugh", "save"]) {
      const expected = other === action ? "saturate(200%)" : "saturate(50%)";
      expect(screen.getByTestId(`tooltip-${other}`).style.filter).toBe(expected);
    }
  });

  it.each([
    ["at the anchor when there is room", 100, 300, "100px", "220px"],
    ["pulled left at the right edge", 900, 300, "740px", "220px"],
    ["exactly on the clamp boundary", 740, 80, "740px", "0px"],
  ])("is placed above the post, %s", (_name, x, y, left, top) => {
    const { tip } = setup(makePost(), x, y);
    expect(tip.style.left).toBe(left);
    expect(tip.style.top).toBe(top);
  });

  it("closes when the pointer leaves the tooltip", () => {
    const { onClose, tip } = setup();
    fireEvent.mouseLeave(tip);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ContextMenu", () => {
  const setup = (post: Post = makePost(), x = 70, y = 90) => {
    const onReact = jest.fn();
    const onClose = jest.fn();
    render(<ContextMenu post={post} x={x} y={y} onReact={onReact} onClose={onClose} />);
    return { onReact, onClose, menu: screen.getByTestId("context-menu") };
  };

  it("opens at the given coordinates with all five actions", () => {
    const { menu } = setup();
    expect(menu.style.left).toBe("70px");
    expect(menu.style.top).toBe("90px");
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(
      ["❤️ Like", "😂 Laugh", "💾 Save", "🔗 Share", "💬 View Post"],
    );
  });

  it.each([
    ["like", "liked_by_me", "❤️ Unlike"],
    ["laugh", "laughed_by_me", "😂 Unlaugh"],
    ["save", "saved_by_me", "💾 Unsave"],
  ] as const)("%s reports the reaction and closes; shows the undo label with a tick when %s", (action, flag, undo) => {
    const { onReact, onClose, menu } = setup(makePost({ [flag]: true }));
    const button = screen.getByTestId(`ctx-${action}`);
    expect(button).toHaveTextContent(undo);
    expect(button).toHaveTextContent("✓");
    expect(menu.textContent?.match(/✓/g)).toHaveLength(1);

    fireEvent.click(button);
    expect(onReact).toHaveBeenCalledWith(42, action);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("'View Post' navigates to the post and closes without reacting", () => {
    const { onReact, onClose } = setup();
    fireEvent.click(screen.getByTestId("ctx-view"));
    expect(mockPush).toHaveBeenCalledWith("/post/42");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onReact).not.toHaveBeenCalled();
  });

  it.each([
    ["the share URL from the server", { share_url: "/s/abc" }, "http://localhost/s/abc"],
    ["the post URL when the server gives none", {}, "http://localhost/post/42"],
  ])("'Share' copies %s, confirms and closes", async (_name, data, copied) => {
    mockedApi.post.mockResolvedValue({ data });
    const { onReact, onClose } = setup();
    fireEvent.click(screen.getByTestId("ctx-share"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mockedApi.post).toHaveBeenCalledWith("/posts/share/42");
    expect(writeText).toHaveBeenCalledWith(copied);
    expect(alertSpy).toHaveBeenCalledWith("Post link copied!");
    expect(onReact).not.toHaveBeenCalled();
  });

  it("'Share' logs, skips the confirmation and still closes when the request fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const { onClose } = setup();
    fireEvent.click(screen.getByTestId("ctx-share"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenCalledWith("Chronicle share failed:", expect.any(Error));
    expect(writeText).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("closes when the pointer leaves the menu, and highlights the hovered row", () => {
    const { onClose, menu } = setup();
    const row = screen.getByTestId("ctx-like");
    fireEvent.mouseEnter(row);
    expect(row.style.background).toContain("rgba(255, 255, 255, 0.1)");
    fireEvent.mouseLeave(row);
    expect(row.style.background).not.toContain("rgba");
    fireEvent.mouseLeave(menu);
    expect(onClose).toHaveBeenCalled();
  });
});
