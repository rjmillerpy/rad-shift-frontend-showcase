import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import api from "@/lib/api";
import ComposerModal from "@/components/ComposerModal";
import type { Post } from "@/types/post";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const quoted: Post = {
  id: 42, text: "The post being quoted", username: "bob",
  likes: 1, laughs: 0, reposts: 0, shares: 0, saves: 0, unix_timestamp: 1700000000,
};

const setup = (props: { quotePreview?: Post | null; quotePostId?: number | null } = {}) => {
  const handlers = { onClearQuote: jest.fn(), onPostCreated: jest.fn(), onClose: jest.fn() };
  const utils = render(
    <ComposerModal
      token="test-token"
      quotePreview={props.quotePreview ?? null}
      quotePostId={props.quotePostId ?? null}
      {...handlers}
    />,
  );
  return { ...handlers, ...utils };
};

const writeAndPost = async (text: string) => {
  fireEvent.change(screen.getByPlaceholderText("Write a post..."), { target: { value: text } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Post" })); });
};
const sentForm = () => mockedApi.post.mock.calls[0][1] as FormData;

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("ComposerModal", () => {
  it("shows the heading and the composer", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Create Post" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a post...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
  });

  it("closes from the close button", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Close composer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", () => {
    const { onClose, container } = setup();
    fireEvent.pointerDown(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when the dialog itself is clicked or typed in", () => {
    const { onClose } = setup();
    fireEvent.pointerDown(screen.getByRole("heading", { name: "Create Post" }));
    fireEvent.click(screen.getByPlaceholderText("Write a post..."));
    fireEvent.change(screen.getByPlaceholderText("Write a post..."), { target: { value: "draft" } });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows no quote preview for a plain post", () => {
    setup();
    expect(screen.queryByText(/^Quoting @/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear quote" })).not.toBeInTheDocument();
  });

  it("previews the quoted post and lets the user clear it", () => {
    const { onClearQuote, onClose } = setup({ quotePreview: quoted, quotePostId: 42 });
    expect(screen.getByText("Quoting @bob")).toBeInTheDocument();
    expect(screen.getByText("The post being quoted")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear quote" }));
    expect(onClearQuote).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test.each<[string, number | null, string | null]>([
    ["a plain post", null, null],
    ["a quote post", 42, "42"],
  ])("publishes %s and reports it was created", async (_name, quotePostId, parentId) => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { onPostCreated, onClearQuote } = setup({ quotePostId, quotePreview: quotePostId ? quoted : null });
    await writeAndPost("Hello feed");

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post.mock.calls[0][0]).toBe("/posts/add");
    expect(sentForm().get("text")).toBe("Hello feed");
    expect(sentForm().get("is_draft")).toBe("false");
    expect(sentForm().get("parent_post_id")).toBe(parentId);
    expect(onPostCreated).toHaveBeenCalledTimes(1);
    expect(onClearQuote).toHaveBeenCalledTimes(1);
  });

  it("does not report a post when the text is blank", async () => {
    const { onPostCreated } = setup();
    await writeAndPost("   ");
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(onPostCreated).not.toHaveBeenCalled();
  });

  it("does not report a post when publishing fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("500"));
    const { onPostCreated, onClearQuote, onClose } = setup();
    await writeAndPost("Hello feed");
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(onPostCreated).not.toHaveBeenCalled();
    expect(onClearQuote).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Write a post...")).toHaveValue("Hello feed");
  });
});
