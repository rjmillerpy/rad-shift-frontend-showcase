import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import type { WidgetInfo } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "7" }) }));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import WidgetDetailPage from "@/app/widgets/[id]/page";

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const del = api.delete as jest.Mock;

const widget: WidgetInfo = {
  id: 7, title: "Pomodoro", description: "A focus timer", category: "tool", language: "javascript", icon_emoji: "⏱",
  author_username: "alice", status: "approved", install_count: 25, likes: 10, saves: 3, rating_avg: 4.25,
  default_width: 400, default_height: 300, resizable: false, tags: null, permissions: null,
};
const reviews = [
  { id: 1, username: "bob", rating: 5, text: "Love it", created_at: "2026-01-01" },
  { id: 2, username: "carol", rating: 2, text: "Too loud", created_at: "2026-01-02" },
];

/** Serve the detail and review endpoints, then render and wait for the page to load. */
async function renderPage(detail: object = { widget }, reviewData: object = { reviews: [] }) {
  get.mockImplementation((url: string) =>
    url === "/widgets/7" ? Promise.resolve({ data: detail })
      : url === "/widgets/7/reviews" ? Promise.resolve({ data: reviewData })
        : Promise.reject(new Error(`unexpected GET ${url}`)));
  render(<WidgetDetailPage />);
  await screen.findByRole("heading", { level: 1 });
}

const button = (name: string | RegExp) => screen.getByRole("button", { name });

beforeEach(() => {
  jest.clearAllMocks();
  post.mockResolvedValue({ data: {} });
  del.mockResolvedValue({ data: {} });
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("WidgetDetailPage", () => {
  it("shows a loading state until the widget arrives", async () => {
    get.mockReturnValue(new Promise(() => {}));
    render(<WidgetDetailPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/widgets/7");
    expect(get).toHaveBeenCalledWith("/widgets/7/reviews");
  });

  it("renders the widget header, author link, store link, average rating and sandboxed preview", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pomodoro");
    expect(screen.getByText("⏱")).toBeInTheDocument();
    expect(screen.getByText("A focus timer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute("href", "/profile/alice");
    expect(screen.getByRole("link", { name: "Back to Store" })).toHaveAttribute("href", "/widgets");
    expect(screen.getByText("Avg: 4.3/5")).toBeInTheDocument();
    const frame = screen.getByTitle("Pomodoro");
    expect(frame.getAttribute("src")).toMatch(/\/widgets\/7\/render$/);
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(frame).toHaveStyle({ width: "400px", height: "300px" });
  });

  it("falls back to a default icon and description and hides the average when the widget has none", async () => {
    await renderPage({ widget: { ...widget, icon_emoji: null, description: null, rating_avg: null } });
    expect(screen.getByText("🧩")).toBeInTheDocument();
    expect(screen.getByText("No description provided.")).toBeInTheDocument();
    expect(screen.queryByText(/^Avg:/)).not.toBeInTheDocument();
  });

  it("accepts a bare widget payload and reflects the viewer's existing install, like and save", async () => {
    await renderPage({ ...widget, installed: true, liked: true, saved: true });
    expect(button("Uninstall (25)")).toBeInTheDocument();
    expect(button("Liked (10)")).toBeInTheDocument();
    expect(button("Saved")).toBeInTheDocument();
  });

  it.each([
    ["like", "Like (10)", "Liked (11)", "Like (10)"],
    ["save", "Save", "Saved", "Save"],
    ["install", "Install (25)", "Uninstall (26)", "Install (25)"],
  ])("toggles %s on with POST and off again with DELETE", async (action, off, on, offAgain) => {
    await renderPage();
    fireEvent.click(button(off));
    fireEvent.click(await screen.findByRole("button", { name: on }));
    expect(await screen.findByRole("button", { name: offAgain })).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(`/widgets/7/${action}`);
    expect(del).toHaveBeenCalledWith(`/widgets/7/${action}`);
  });

  it.each([
    ["like", "Liked (0)", "Like (0)", { likes: 0 }, { liked: true }],
    ["install", "Uninstall (0)", "Install (0)", { install_count: 0 }, { installed: true }],
  ])("never shows a negative %s count", async (_action, on, off, counts, flags) => {
    await renderPage({ widget: { ...widget, ...counts }, ...flags });
    fireEvent.click(button(on));
    expect(await screen.findByRole("button", { name: off })).toBeInTheDocument();
  });

  it("leaves the like state unchanged when the API rejects", async () => {
    post.mockRejectedValue(new Error("offline"));
    await renderPage();
    fireEvent.click(button("Like (10)"));
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(button("Like (10)")).toBeInTheDocument();
  });

  it("highlights the viewer's saved rating and updates it on click", async () => {
    await renderPage({ widget, my_rating: 2 });
    const lit = () => screen.getAllByRole("button", { name: "★" }).filter((star) => star.style.color === "rgb(241, 196, 15)");
    expect(lit()).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "★" })[4]);
    expect(lit()).toHaveLength(5);
    expect(post).toHaveBeenCalledWith("/widgets/7/rate", { rating: 5 });
  });

  it("lists reviews with their star ratings, or an empty state", async () => {
    await renderPage({ widget }, { reviews });
    expect(screen.getByText("bob").nextElementSibling).toHaveTextContent("*****");
    expect(screen.getByText("carol").nextElementSibling).toHaveTextContent(/^\*\*$/);
    expect(screen.getByText("Too loud")).toBeInTheDocument();
    expect(screen.queryByText("No reviews yet. Be the first!")).not.toBeInTheDocument();
  });

  it("posts a trimmed review with the viewer's rating, shows it first and clears the box", async () => {
    post.mockResolvedValue({ data: { review: { id: 9, username: "me", rating: 4, text: "Nice", created_at: "now" } } });
    await renderPage({ widget, my_rating: 4 }, reviews);
    const box = screen.getByPlaceholderText("Write a review...");
    fireEvent.change(box, { target: { value: "  Nice  " } });
    fireEvent.click(button("Post"));
    expect(await screen.findByText("Nice")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/widgets/7/reviews", { text: "Nice", rating: 4 });
    expect(box).toHaveValue("");
    const authors = screen.getAllByText(/^(me|bob|carol)$/).map((el) => el.textContent);
    expect(authors).toEqual(["me", "bob", "carol"]);
  });

  it.each([
    ["an empty review", ""],
    ["a whitespace-only review", "   "],
  ])("does not post %s", async (_label, text) => {
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText("Write a review..."), { target: { value: text } });
    fireEvent.click(button("Post"));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("No reviews yet. Be the first!")).toBeInTheDocument();
  });

  it("submits a trimmed report, confirms it and closes the dialog", async () => {
    const alert = jest.spyOn(window, "alert").mockImplementation(() => {});
    await renderPage();
    fireEvent.click(button("Report"));
    fireEvent.click(button("Submit Report"));
    expect(post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Describe the issue..."), { target: { value: " Mines crypto \n" } });
    fireEvent.click(button("Submit Report"));
    await waitFor(() => expect(alert).toHaveBeenCalledWith("Report submitted"));
    expect(post).toHaveBeenCalledWith("/widgets/7/report", { reason: "Mines crypto" });
    expect(screen.queryByText("Report Widget")).not.toBeInTheDocument();
  });

  it("closes the report dialog on a backdrop click but not on a click inside it", async () => {
    await renderPage();
    fireEvent.click(button("Report"));
    const heading = screen.getByText("Report Widget");
    fireEvent.pointerDown(heading);
    expect(heading).toBeInTheDocument();
    fireEvent.pointerDown(heading.parentElement?.parentElement as HTMLElement);
    expect(screen.queryByText("Report Widget")).not.toBeInTheDocument();
  });

  it("copies the page URL when Share is clicked", async () => {
    // Like the real API: writeText returns a promise.
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await renderPage();
    fireEvent.click(button("Share"));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("logs a refused copy instead of leaving an unhandled rejection", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("NotAllowedError"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await renderPage();
    fireEvent.click(button("Share"));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith("Copy failed:", expect.any(Error)));
    consoleError.mockRestore();
    Reflect.deleteProperty(navigator, "clipboard");
  });
});
