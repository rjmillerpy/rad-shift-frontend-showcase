import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import VideoPlayer from "@/components/VideoPlayer";

// Mock HTMLMediaElement methods since jsdom doesn't support media
const mockVideoPlay = jest.fn().mockResolvedValue(undefined);
const mockVideoPause = jest.fn();
const mockRequestPiP = jest.fn().mockResolvedValue(undefined);
const mockExitPiP = jest.fn().mockResolvedValue(undefined);
const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined);
const mockExitFullscreen = jest.fn().mockResolvedValue(undefined);

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: mockVideoPlay,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: mockVideoPause,
  });
  Object.defineProperty(HTMLVideoElement.prototype, "requestPictureInPicture", {
    configurable: true,
    value: mockRequestPiP,
  });
  Object.defineProperty(document, "exitPictureInPicture", {
    configurable: true,
    value: mockExitPiP,
  });
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
    configurable: true,
    value: mockRequestFullscreen,
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    value: mockExitFullscreen,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function fireVideoEvent(type: string): void {
  const video = document.querySelector("video")!;
  fireEvent(video, new Event(type));
}

const defaultProps = {
  src: "https://example.com/video.mp4",
};

describe("VideoPlayer", () => {
  it("renders video element with src", () => {
    render(<VideoPlayer {...defaultProps} />);

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "https://example.com/video.mp4");
  });

  it("play overlay is visible when paused", () => {
    render(<VideoPlayer {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
  });

  it("clicking video calls play", () => {
    render(<VideoPlayer {...defaultProps} />);

    const video = document.querySelector("video")!;
    fireEvent.click(video);

    expect(mockVideoPlay).toHaveBeenCalled();
  });

  it("clicking play overlay calls play", () => {
    render(<VideoPlayer {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    expect(mockVideoPlay).toHaveBeenCalled();
  });

  it("renders volume slider", () => {
    render(<VideoPlayer {...defaultProps} />);

    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it("renders video progress slider", () => {
    render(<VideoPlayer {...defaultProps} />);

    expect(screen.getByRole("slider", { name: "Video progress" })).toBeInTheDocument();
  });

  it("renders PiP and Fullscreen buttons", () => {
    render(<VideoPlayer {...defaultProps} />);

    expect(screen.getByText("PiP")).toBeInTheDocument();
    expect(screen.getByTitle("Fullscreen")).toBeInTheDocument();
  });

  it("shows time display", () => {
    render(<VideoPlayer {...defaultProps} />);

    // Should show "0:00 / 0:00" initially
    expect(screen.getByText("0:00 / 0:00")).toBeInTheDocument();
  });

  test.each([
    { desc: "with metadata duration", metadata: { duration_seconds: 120 } },
    { desc: "without metadata", metadata: null },
    { desc: "with metadata undefined", metadata: undefined },
  ])("renders correctly $desc", ({ metadata }) => {
    render(<VideoPlayer src="https://example.com/v.mp4" metadata={metadata} />);
    expect(document.querySelector("video")).toBeInTheDocument();
  });

  describe("video event handlers", () => {
    test("timeupdate event refreshes currentTime display", () => {
      render(<VideoPlayer src="s" metadata={{ duration_seconds: 60 }} />);
      const video = document.querySelector("video") as HTMLVideoElement;
      Object.defineProperty(video, "currentTime", { configurable: true, value: 15 });
      act(() => fireVideoEvent("timeupdate"));
      expect(screen.getByText("0:15 / 1:00")).toBeInTheDocument();
    });

    test("loadedmetadata event updates duration from video element", () => {
      render(<VideoPlayer src="s" />);
      const video = document.querySelector("video") as HTMLVideoElement;
      Object.defineProperty(video, "duration", { configurable: true, value: 90 });
      act(() => fireVideoEvent("loadedmetadata"));
      expect(screen.getByText("0:00 / 1:30")).toBeInTheDocument();
    });

    test("play event flips control icon to pause", () => {
      render(<VideoPlayer src="s" />);
      act(() => fireVideoEvent("play"));
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    });

    test("pause event restores the play overlay", () => {
      render(<VideoPlayer src="s" />);
      act(() => fireVideoEvent("play"));
      act(() => fireVideoEvent("pause"));
      expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
    });

    test("ended event reverts play state", () => {
      render(<VideoPlayer src="s" />);
      act(() => fireVideoEvent("play"));
      act(() => fireVideoEvent("ended"));
      expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
    });
  });

  describe("progress bar interactions", () => {
    test("clicking the bar seeks the video", () => {
      render(<VideoPlayer src="s" metadata={{ duration_seconds: 100 }} />);
      const video = document.querySelector("video") as HTMLVideoElement;
      let seekedTo = -1;
      Object.defineProperty(video, "currentTime", {
        configurable: true,
        get: () => 0,
        set: (v: number) => { seekedTo = v; },
      });
      const bar = screen.getByRole("slider", { name: "Video progress" });
      jest.spyOn(bar, "getBoundingClientRect").mockReturnValue({
        left: 0, width: 100, top: 0, right: 100, bottom: 10, height: 10, x: 0, y: 0, toJSON: () => ({}),
      } as DOMRect);

      fireEvent.click(bar, { clientX: 25 });
      expect(seekedTo).toBe(25);
    });

    test("clicking the bar with zero duration is a no-op", () => {
      render(<VideoPlayer src="s" />);
      const video = document.querySelector("video") as HTMLVideoElement;
      const setter = jest.fn();
      Object.defineProperty(video, "currentTime", { configurable: true, set: setter, get: () => 0 });
      fireEvent.click(screen.getByRole("slider", { name: "Video progress" }), { clientX: 10 });
      expect(setter).not.toHaveBeenCalled();
    });
  });

  describe("volume control", () => {
    test("slider change updates video volume and display value", () => {
      render(<VideoPlayer src="s" />);
      const video = document.querySelector("video") as HTMLVideoElement;
      fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "0.3" } });
      expect(video.volume).toBeCloseTo(0.3);
    });
  });

  describe("fullscreen", () => {
    beforeEach(() => {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
    });

    test("clicking fullscreen button requests fullscreen", () => {
      render(<VideoPlayer src="s" />);
      fireEvent.click(screen.getByTitle("Fullscreen"));
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });

    test("when already fullscreen, button exits fullscreen", () => {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body });
      render(<VideoPlayer src="s" />);
      act(() => {
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      fireEvent.click(screen.getByTitle("Exit fullscreen"));
      expect(mockExitFullscreen).toHaveBeenCalled();
    });
  });

  describe("picture-in-picture", () => {
    beforeEach(() => {
      Object.defineProperty(document, "pictureInPictureElement", { configurable: true, value: null });
    });

    test("clicking PiP requests picture-in-picture", () => {
      render(<VideoPlayer src="s" />);
      fireEvent.click(screen.getByTitle("Picture-in-Picture"));
      expect(mockRequestPiP).toHaveBeenCalled();
    });

    test("when already in PiP, clicking exits picture-in-picture", () => {
      const video = document.createElement("video");
      Object.defineProperty(document, "pictureInPictureElement", { configurable: true, value: video });
      render(<VideoPlayer src="s" />);
      fireEvent.click(screen.getByTitle("Picture-in-Picture"));
      expect(mockExitPiP).toHaveBeenCalled();
    });
  });

  describe("controls visibility timer", () => {
    test("after playing, controls hide after 3s of no movement", () => {
      render(<VideoPlayer src="s" />);
      act(() => fireVideoEvent("play"));
      act(() => fireEvent.mouseMove(document.querySelector("video")!.parentElement!));
      act(() => { jest.advanceTimersByTime(3500); });
      // Pointer events turn off when hidden — check opacity via the container
      const progressBar = screen.getByRole("slider", { name: "Video progress" });
      expect(progressBar.parentElement).toHaveStyle({ "pointer-events": "none" });
    });
  });
});
