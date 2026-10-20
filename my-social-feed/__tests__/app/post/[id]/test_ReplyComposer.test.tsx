import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import api from "@/lib/api";
import ReplyComposer from "@/app/post/[id]/ReplyComposer";
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
  const handlers = { onPosted: jest.fn(), onClose: jest.fn() };
  render(<ReplyComposer post={post} {...handlers} />);
  return handlers;
};

const typeAndSubmit = async (text: string) => {
  fireEvent.change(screen.getByTestId("reply-input"), { target: { value: text } });
  await act(async () => { fireEvent.click(screen.getByTestId("reply-submit")); });
};

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("ReplyComposer", () => {
  it("names the author being replied to and starts empty", () => {
    setup(makePost({ username: "bob" }));
    expect(screen.getByTestId("reply-composer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reply to @bob" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a reply...")).toHaveValue("");
  });

  it("keeps what the user types", () => {
    setup();
    fireEvent.change(screen.getByTestId("reply-input"), { target: { value: "Nice point" } });
    expect(screen.getByTestId("reply-input")).toHaveValue("Nice point");
  });

  test.each([
    [42, "42"],
    [1007, "1007"],
  ])("posts the reply under post %i and reports it", async (id, parentId) => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { onPosted, onClose } = setup(makePost({ id }));
    await typeAndSubmit("Nice point");

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    const [url, body] = mockedApi.post.mock.calls[0];
    expect(url).toBe("/posts/add");
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(Object.fromEntries(body as URLSearchParams)).toEqual({
      text: "Nice point",
      post_metadata: "{}",
      is_draft: "false",
      is_reply: "true",
      parent_post_id: parentId,
    });
    expect(onPosted).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test.each([
    ["empty", ""],
    ["spaces only", "    "],
    ["newlines only", "\n\n"],
  ])("does nothing when the reply text is %s", async (_name, text) => {
    const { onPosted, onClose } = setup();
    await typeAndSubmit(text);
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(onPosted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stays open with the draft intact when posting fails", async () => {
    const failure = new Error("500");
    mockedApi.post.mockRejectedValue(failure);
    const { onPosted, onClose } = setup();
    await typeAndSubmit("Nice point");

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("Error posting reply:", failure);
    expect(onPosted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("reply-input")).toHaveValue("Nice point");
  });

  it("cancels without posting", () => {
    const { onPosted, onClose } = setup();
    fireEvent.change(screen.getByTestId("reply-input"), { target: { value: "never mind" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPosted).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
