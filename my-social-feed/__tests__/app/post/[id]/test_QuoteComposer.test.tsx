import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import api from "@/lib/api";
import QuoteComposer from "@/app/post/[id]/QuoteComposer";
import { QUOTED_TEXT_PREVIEW_CHARS } from "@/app/post/[id]/constants";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 42, text: "Detailed post content", username: "alice",
  likes: 0, laughs: 0, reposts: 0, shares: 0, saves: 0, unix_timestamp: 1700000000,
  ...overrides,
});

const setup = (post: Post = makePost()) => {
  const onClose = jest.fn();
  render(<QuoteComposer post={post} onClose={onClose} />);
  return { onClose };
};

const typeAndSubmit = async (text: string) => {
  fireEvent.change(screen.getByTestId("quote-input"), { target: { value: text } });
  await act(async () => { fireEvent.click(screen.getByTestId("quote-submit")); });
};

let alertSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("QuoteComposer", () => {
  it("names the quoted author and shows the quoted text", () => {
    setup();
    expect(screen.getByTestId("quote-composer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quoting @alice" })).toBeInTheDocument();
    expect(screen.getByText("Detailed post content")).toBeInTheDocument();
    expect(screen.getByTestId("quote-input")).toHaveValue("");
  });

  test.each([
    ["one under the limit", QUOTED_TEXT_PREVIEW_CHARS - 1, false],
    ["exactly at the limit", QUOTED_TEXT_PREVIEW_CHARS, false],
    ["one over the limit", QUOTED_TEXT_PREVIEW_CHARS + 1, true],
    ["far over the limit", QUOTED_TEXT_PREVIEW_CHARS * 3, true],
  ])("previews a quoted text %s (truncated: %s)", (_name, length, truncated) => {
    const text = "q".repeat(length);
    setup(makePost({ text }));
    const expected = truncated ? `${"q".repeat(QUOTED_TEXT_PREVIEW_CHARS)}…` : text;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("posts the quote against the quoted post, confirms and closes", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { onClose } = setup();
    await typeAndSubmit("My hot take");

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    const [url, body] = mockedApi.post.mock.calls[0];
    expect(url).toBe("/posts/add");
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(Object.fromEntries(body as URLSearchParams)).toEqual({
      text: "My hot take",
      post_metadata: "{}",
      is_draft: "false",
      parent_post_id: "42",
    });
    expect(alertSpy).toHaveBeenCalledWith("Quote posted!");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["empty", ""],
    ["spaces only", "    "],
    ["newlines only", "\n\n"],
  ])("does nothing when the quote text is %s", async (_name, text) => {
    const { onClose } = setup();
    await typeAndSubmit(text);
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stays open with the draft intact when posting fails", async () => {
    const failure = new Error("500");
    mockedApi.post.mockRejectedValue(failure);
    const { onClose } = setup();
    await typeAndSubmit("My hot take");

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("Error posting quote:", failure);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("quote-input")).toHaveValue("My hot take");
  });

  it("cancels without posting", () => {
    const { onClose } = setup();
    fireEvent.change(screen.getByTestId("quote-input"), { target: { value: "never mind" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
