import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ChapterContent from "@/app/chronicle/ChapterContent";
import type { ChapterData, Segment } from "@/app/chronicle/types";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1, text: "First post about technology", username: "alice",
  likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 3, unix_timestamp: 1700000000,
  ...overrides,
});

const makeChapter = (segments: Segment[], posts: Post[] = [makePost()]): ChapterData => ({
  segments, posts, page: 0, has_more: true, cached: false,
});

type Props = React.ComponentProps<typeof ChapterContent>;
const setup = (overrides: Partial<Props> = {}) => {
  const handlers = { onPostHover: jest.fn(), onPostLeave: jest.fn(), onPostContextMenu: jest.fn() };
  const utils = render(
    <ChapterContent chapter={undefined} generating={false} hoveredPostId={null} {...handlers} {...overrides} />,
  );
  return { ...utils, ...handlers };
};

describe("ChapterContent — empty and generating states", () => {
  it.each([
    ["no chapter", undefined],
    ["a chapter with no segments", makeChapter([])],
  ])("shows the empty message for %s", (_name, chapter) => {
    setup({ chapter });
    expect(screen.getByText("No posts to chronicle yet.")).toBeInTheDocument();
    expect(screen.queryByTestId("writing-indicator")).not.toBeInTheDocument();
  });

  it.each([
    ["no chapter yet", undefined, "The chronicler is gathering thoughts...", "Still writing..."],
    ["an initialised chapter with no segments", makeChapter([]), "The chronicler is gathering thoughts...", "Still writing..."],
    ["segments already streaming in", makeChapter([{ type: "narrative", text: "Once upon a time" }]),
      "Still writing...", "The chronicler is gathering thoughts..."],
  ])("while generating with %s, shows the matching indicator", (_name, chapter, shown, hidden) => {
    setup({ chapter, generating: true });
    const indicator = screen.getByTestId("writing-indicator");
    expect(within(indicator).getByText(shown)).toBeInTheDocument();
    expect(within(indicator).queryByText(hidden)).not.toBeInTheDocument();
    expect(screen.queryByText("No posts to chronicle yet.")).not.toBeInTheDocument();
  });

  it("hides the writing indicator once generation is finished", () => {
    setup({ chapter: makeChapter([{ type: "narrative", text: "Done." }]) });
    expect(screen.queryByTestId("writing-indicator")).not.toBeInTheDocument();
  });
});

describe("ChapterContent — narrative", () => {
  const chapter = makeChapter([
    { type: "narrative", text: "As the day unfolded" },
    { type: "narrative", text: "Meanwhile, elsewhere" },
  ]);

  it("gives only the opening paragraph a drop cap, keeping the full text readable", () => {
    setup({ chapter });
    const [first, second] = screen.getAllByTestId("narrative-segment");
    expect(within(first).getByText("A").style.cssFloat).toBe("left");
    expect(first).toHaveTextContent("As the day unfolded");
    expect(second.querySelector("span")).toBeNull();
    expect(second).toHaveTextContent("Meanwhile, elsewhere");
  });

  it("holds back the drop cap while the chapter is still being generated", () => {
    setup({ chapter, generating: true });
    const [first] = screen.getAllByTestId("narrative-segment");
    expect(first.querySelector("span")).toBeNull();
    expect(first).toHaveTextContent("As the day unfolded");
  });

  it("renders an empty opening narrative without a drop cap", () => {
    setup({ chapter: makeChapter([{ type: "narrative", text: "" }, { type: "narrative", text: "Next" }]) });
    const [first] = screen.getAllByTestId("narrative-segment");
    expect(first.querySelector("span")).toBeNull();
    expect(first.textContent?.trim()).toBe("");
  });
});

describe("ChapterContent — post segments", () => {
  it.each([
    ["post", { type: "post", index: 0 } as Segment],
    ["media", { type: "media", index: 0 } as Segment],
  ])("renders a %s segment as the quoted post text tagged with its id", (_name, segment) => {
    setup({ chapter: makeChapter([segment], [makePost({ id: 31 })]) });
    const seg = screen.getByTestId("post-segment");
    expect(seg).toHaveTextContent("“First post about technology”");
    expect(seg).toHaveAttribute("data-post-id", "31");
  });

  it("skips segments that point at a post that isn't in the chapter", () => {
    setup({ chapter: makeChapter([{ type: "post", index: 5 }, { type: "post", index: 0 }]) });
    expect(screen.getAllByTestId("post-segment")).toHaveLength(1);
  });

  it.each([
    ["image", { image_url: "https://example.com/pic.jpg" }, "img", "https://example.com/pic.jpg"],
    ["video", { video_url: "https://example.com/vid.mp4" }, "video", "https://example.com/vid.mp4"],
    ["audio", { audio_url: "https://example.com/a.mp3" }, "audio", "https://example.com/a.mp3"],
  ])("illustrates a post that has %s and credits the author", (_kind, media, tag, src) => {
    setup({ chapter: makeChapter([{ type: "post", index: 0 }], [makePost(media)]) });
    const block = screen.getByTestId("media-segment");
    expect(block.querySelector(tag)).toHaveAttribute("src", src);
    expect(block.querySelectorAll("img, video, audio")).toHaveLength(1);
    expect(block).toHaveTextContent("shared by @alice");
  });

  it("uses the image as the poster when a post has both image and video", () => {
    const media = { image_url: "https://example.com/pic.jpg", video_url: "https://example.com/vid.mp4" };
    setup({ chapter: makeChapter([{ type: "post", index: 0 }], [makePost(media)]) });
    expect(screen.getByTestId("media-segment").querySelector("video")).toHaveAttribute("poster", media.image_url);
  });

  it("renders no media block for a text-only post", () => {
    setup({ chapter: makeChapter([{ type: "post", index: 0 }]) });
    expect(screen.queryByTestId("media-segment")).not.toBeInTheDocument();
  });

  it("highlights only the hovered post", () => {
    const posts = [makePost({ id: 1, text: "One" }), makePost({ id: 2, text: "Two" })];
    setup({ chapter: makeChapter([{ type: "post", index: 0 }, { type: "post", index: 1 }], posts), hoveredPostId: 2 });
    const [one, two] = screen.getAllByTestId("post-segment");
    expect(one.style.background).toContain("0.15");
    expect(two.style.background).toContain("0.4");
  });
});

describe("ChapterContent — post interactions", () => {
  const post = makePost({ id: 31 });
  const chapter = makeChapter([{ type: "post", index: 0 }], [post]);

  it("reports hover with the post id and the segment's bounding box", () => {
    const { onPostHover } = setup({ chapter });
    const seg = screen.getByTestId("post-segment");
    fireEvent.mouseEnter(seg);
    expect(onPostHover).toHaveBeenCalledTimes(1);
    expect(onPostHover).toHaveBeenCalledWith(31, seg.getBoundingClientRect());
  });

  it("reports leave with the element the pointer moved to", () => {
    const { onPostLeave } = setup({
      chapter: makeChapter([{ type: "narrative", text: "Then" }, { type: "post", index: 0 }], [post]),
      generating: true,
    });
    const movedTo = screen.getByTestId("narrative-segment");
    fireEvent.mouseLeave(screen.getByTestId("post-segment"), { relatedTarget: movedTo });
    expect(onPostLeave).toHaveBeenCalledTimes(1);
    expect(onPostLeave).toHaveBeenCalledWith(movedTo);
  });

  it("reports a right-click with the post and cursor, suppressing the browser menu", () => {
    const { onPostContextMenu } = setup({ chapter });
    const notCancelled = fireEvent.contextMenu(screen.getByTestId("post-segment"), { clientX: 12, clientY: 34 });
    expect(notCancelled).toBe(false);
    expect(onPostContextMenu).toHaveBeenCalledWith(post, 12, 34);
  });
});
