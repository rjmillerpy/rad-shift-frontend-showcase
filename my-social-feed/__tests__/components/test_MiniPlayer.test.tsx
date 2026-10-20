import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MiniPlayer from "@/components/MiniPlayer";
import type { NowPlayingTrack } from "@/hooks/useGlobalAudio";

// Mutable mock state so each test can configure it
const mockState = {
  track: null as NowPlayingTrack | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  pause: jest.fn(),
  resume: jest.fn(),
  stop: jest.fn(),
  seekTo: jest.fn(),
  play: jest.fn(),
  audioRef: { current: null },
};

jest.mock("@/hooks/useGlobalAudio", () => ({
  useGlobalAudio: () => mockState,
}));

// Mock next/link to render a plain anchor
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

beforeEach(() => {
  jest.clearAllMocks();
  mockState.track = null;
  mockState.isPlaying = false;
  mockState.currentTime = 0;
  mockState.duration = 0;
});

describe("MiniPlayer", () => {
  it("returns null when no track", () => {
    const { container } = render(<MiniPlayer />);
    expect(container.firstChild).toBeNull();
  });

  it("shows track info when track is set", () => {
    mockState.track = {
      src: "https://example.com/song.mp3",
      postId: 7,
      username: "bob",
      text: "Check out this banger",
    };
    mockState.isPlaying = true;
    mockState.duration = 200;
    mockState.currentTime = 45;

    render(<MiniPlayer />);

    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Check out this banger")).toBeInTheDocument();
    expect(screen.getByText("0:45 / 3:20")).toBeInTheDocument();
  });

  it("truncates long text with ellipsis", () => {
    const longText = "A".repeat(80);
    mockState.track = {
      src: "https://example.com/song.mp3",
      postId: 1,
      username: "alice",
      text: longText,
    };

    render(<MiniPlayer />);

    // Should be truncated to 60 chars + ellipsis
    expect(screen.getByText("A".repeat(60) + "\u2026")).toBeInTheDocument();
  });

  it("clicking pause calls pause handler when playing", () => {
    mockState.track = {
      src: "https://example.com/song.mp3",
      postId: 1,
      username: "alice",
      text: "Song",
    };
    mockState.isPlaying = true;

    render(<MiniPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(mockState.pause).toHaveBeenCalled();
  });

  it("clicking play calls resume handler when paused", () => {
    mockState.track = {
      src: "https://example.com/song.mp3",
      postId: 1,
      username: "alice",
      text: "Song",
    };
    mockState.isPlaying = false;

    render(<MiniPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(mockState.resume).toHaveBeenCalled();
  });

  it("clicking close calls stop handler", () => {
    mockState.track = {
      src: "https://example.com/song.mp3",
      postId: 1,
      username: "alice",
      text: "Song",
    };

    render(<MiniPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Close player" }));
    expect(mockState.stop).toHaveBeenCalled();
  });

  it("links to the post page", () => {
    mockState.track = {
      src: "https://example.com/song.mp3",
      postId: 42,
      username: "charlie",
      text: "My track",
    };

    render(<MiniPlayer />);

    const link = screen.getByText("@charlie").closest("a");
    expect(link).toHaveAttribute("href", "/post/42");
  });

  test.each([
    { currentTime: 0, duration: 0, expected: "0:00 / 0:00" },
    { currentTime: 61, duration: 120, expected: "1:01 / 2:00" },
    { currentTime: 3599, duration: 3600, expected: "59:59 / 60:00" },
  ])(
    "formats time $currentTime/$duration as $expected",
    ({ currentTime, duration, expected }) => {
      mockState.track = {
        src: "https://example.com/song.mp3",
        postId: 1,
        username: "u",
        text: "t",
      };
      mockState.currentTime = currentTime;
      mockState.duration = duration;

      render(<MiniPlayer />);

      expect(screen.getByText(expected)).toBeInTheDocument();
    }
  );

  it("clicking the progress bar seeks", () => {
    mockState.track = { src: "s", postId: 1, username: "u", text: "t" };
    mockState.duration = 200;

    render(<MiniPlayer />);
    const bar = screen.getByText("@u").closest("div")?.parentElement?.parentElement?.querySelector('[style*="cursor: pointer"]') as HTMLElement;
    // Use a simpler lookup: the first clickable div inside the mini-player is the progress bar
    const progressBar = document.querySelector('[style*="height: 3px"]') as HTMLElement;
    expect(progressBar).not.toBeNull();
    jest.spyOn(progressBar, "getBoundingClientRect").mockReturnValue({
      left: 0, width: 100, top: 0, right: 100, bottom: 10, height: 10, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(progressBar, { clientX: 50 });
    expect(mockState.seekTo).toHaveBeenCalledWith(100); // 50% of 200
  });

  it("clicking the progress bar with zero duration is a no-op", () => {
    mockState.track = { src: "s", postId: 1, username: "u", text: "t" };
    mockState.duration = 0;

    render(<MiniPlayer />);
    const progressBar = document.querySelector('[style*="height: 3px"]') as HTMLElement;
    fireEvent.click(progressBar, { clientX: 50 });
    expect(mockState.seekTo).not.toHaveBeenCalled();
  });

  describe("progress slider (keyboard)", () => {
    const playing = (currentTime: number, duration: number) => {
      mockState.track = { src: "https://example.com/song.mp3", postId: 7, username: "bob", text: "Song" };
      mockState.isPlaying = true;
      mockState.currentTime = currentTime;
      mockState.duration = duration;
      mockState.seekTo.mockClear();
      render(<MiniPlayer />);
      return screen.getByRole("slider", { name: "Seek" });
    };

    it("announces the position", () => {
      const slider = playing(65, 200);
      expect(slider).toHaveAttribute("aria-valuenow", "65");
      expect(slider).toHaveAttribute("aria-valuemax", "200");
      expect(slider).toHaveAttribute("aria-valuetext", "1:05 of 3:20");
    });

    it.each([
      ["ArrowRight", 105],
      ["ArrowUp", 105],
      ["ArrowLeft", 95],
      ["ArrowDown", 95],
      ["Home", 0],
      ["End", 200],
    ])("%s seeks to %d s", (key, target) => {
      fireEvent.keyDown(playing(100, 200), { key });
      expect(mockState.seekTo).toHaveBeenCalledWith(target);
    });

    it("never seeks past either end", () => {
      fireEvent.keyDown(playing(2, 200), { key: "ArrowLeft" });
      expect(mockState.seekTo).toHaveBeenCalledWith(0);
    });

    it("ignores other keys", () => {
      fireEvent.keyDown(playing(100, 200), { key: "a" });
      expect(mockState.seekTo).not.toHaveBeenCalled();
    });
  });
});
