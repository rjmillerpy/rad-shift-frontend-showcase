import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DraftList from "@/app/profile/DraftList";
import type { Post } from "@/types/post";

const makeDraft = (id: number, overrides: Partial<Post> = {}): Post => ({
  id,
  text: `Draft number ${id}`,
  username: "me",
  likes: 0,
  laughs: 0,
  reposts: 0,
  shares: 0,
  saves: 0,
  unix_timestamp: 1700000000 + id * 60,
  ...overrides,
});

describe("DraftList", () => {
  it("says there are no drafts when the list is empty", () => {
    render(<DraftList drafts={[]} onPublish={jest.fn()} />);
    expect(screen.getByText("No drafts yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });

  it("lists each draft's text and saved time, in order, with a publish button", () => {
    const drafts = [makeDraft(3), makeDraft(1), makeDraft(2)];
    render(<DraftList drafts={drafts} onPublish={jest.fn()} />);

    expect(screen.queryByText("No drafts yet.")).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Draft number \d$/).map((el) => el.textContent)).toEqual([
      "Draft number 3", "Draft number 1", "Draft number 2",
    ]);
    for (const draft of drafts) {
      const saved = new Date(draft.unix_timestamp * 1000).toLocaleString();
      expect(screen.getByText(`Saved ${saved}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Publish" })).toHaveLength(3);
  });

  test.each([
    [0, 11],
    [1, 22],
    [2, 33],
  ])("the publish button in row %i publishes draft %i", (row, id) => {
    const onPublish = jest.fn();
    render(<DraftList drafts={[makeDraft(11), makeDraft(22), makeDraft(33)]} onPublish={onPublish} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Publish" })[row]);
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledWith(id);
  });

  it("renders no media for a text-only draft", () => {
    const { container } = render(<DraftList drafts={[makeDraft(1)]} onPublish={jest.fn()} />);
    expect(container.querySelector("img, video, audio")).toBeNull();
  });

  it("renders an attached image", () => {
    render(<DraftList drafts={[makeDraft(1, { image_url: "https://img.example.com/d.png" })]} onPublish={jest.fn()} />);
    expect(screen.getByAltText("Draft")).toHaveAttribute("src", "https://img.example.com/d.png");
  });

  test.each([
    ["video", { video_url: "https://cdn.example.com/d.mp4" }, "https://cdn.example.com/d.mp4"],
    ["audio", { audio_url: "https://cdn.example.com/d.mp3" }, "https://cdn.example.com/d.mp3"],
  ])("renders a %s player for an attached %s", (tag, media, src) => {
    const { container } = render(<DraftList drafts={[makeDraft(1, media)]} onPublish={jest.fn()} />);
    const player = container.querySelector(tag);
    expect(player).toHaveAttribute("controls");
    expect(player?.querySelector("source")).toHaveAttribute("src", src);
    expect(container.querySelector(tag === "video" ? "audio" : "video")).toBeNull();
  });

  it("keeps each draft's media with its own row", () => {
    const { container } = render(
      <DraftList
        drafts={[makeDraft(1), makeDraft(2, { image_url: "https://img.example.com/two.png" })]}
        onPublish={jest.fn()}
      />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(1);
    const row = screen.getByText("Draft number 2").parentElement!;
    expect(row.querySelector("img")).toHaveAttribute("src", "https://img.example.com/two.png");
  });
});
