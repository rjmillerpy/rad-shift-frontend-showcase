import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AudioPlayer from "@/components/AudioPlayer";
import type { MediaMetadata } from "@/types/post";

// Mock useGlobalAudio
const mockPlay = jest.fn();
const mockPause = jest.fn();
jest.mock("@/hooks/useGlobalAudio", () => ({
  useGlobalAudio: () => ({
    track: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    play: mockPlay,
    pause: mockPause,
    resume: jest.fn(),
    seekTo: jest.fn(),
    stop: jest.fn(),
    audioRef: { current: null },
  }),
}));

// Mock HTMLMediaElement methods since jsdom doesn't support media
const mockAudioPlay = jest.fn().mockResolvedValue(undefined);
const mockAudioPause = jest.fn();

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: mockAudioPlay,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: mockAudioPause,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

const defaultProps = {
  src: "https://example.com/track.mp3",
};

describe("AudioPlayer", () => {
  it("renders play button and time display", () => {
    render(<AudioPlayer {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    // Time display shows 0:00 initially
    expect(screen.getAllByText("0:00").length).toBeGreaterThanOrEqual(1);
  });

  it("clicking play calls audio.play()", () => {
    render(<AudioPlayer {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(mockAudioPlay).toHaveBeenCalled();
  });

  it("clicking play then pause calls audio.pause()", () => {
    render(<AudioPlayer {...defaultProps} />);

    // Play
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(mockAudioPlay).toHaveBeenCalled();

    // Now button should say Pause
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(mockAudioPause).toHaveBeenCalled();
  });

  it("shows metadata (format, bitrate) when provided", () => {
    const metadata: MediaMetadata = {
      format: "mp3",
      bitrate: 320000,
      sample_rate: 44100,
      duration_seconds: 180,
    };

    render(<AudioPlayer {...defaultProps} metadata={metadata} />);

    expect(screen.getByText("MP3")).toBeInTheDocument();
    expect(screen.getByText("320 kbps")).toBeInTheDocument();
    expect(screen.getByText("44.1 kHz")).toBeInTheDocument();
  });

  it("does not show metadata line when metadata is null", () => {
    render(<AudioPlayer {...defaultProps} metadata={null} />);

    expect(screen.queryByText("MP3")).not.toBeInTheDocument();
    expect(screen.queryByText(/kbps/)).not.toBeInTheDocument();
  });

  it("volume slider changes audio volume", () => {
    render(<AudioPlayer {...defaultProps} />);

    const volumeSlider = screen.getByRole("slider", { name: "Volume" });
    fireEvent.change(volumeSlider, { target: { value: "0.5" } });

    expect(volumeSlider).toHaveValue("0.5");
  });

  it("speed button cycles through speeds", () => {
    render(<AudioPlayer {...defaultProps} />);

    // Default speed is 1x (index 2 in [0.5, 0.75, 1, 1.25, 1.5, 2])
    const speedButton = screen.getByTitle("Playback speed");
    expect(speedButton).toHaveTextContent("1x");

    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent("1.25x");

    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent("1.5x");

    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent("2x");

    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent("0.5x");

    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent("0.75x");

    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent("1x");
  });

  test.each([
    { format: "flac", expected: "FLAC" },
    { format: "wav", expected: "WAV" },
    { format: "ogg", expected: "OGG" },
  ])("displays $format as $expected", ({ format, expected }) => {
    const metadata: MediaMetadata = { format };
    render(<AudioPlayer src="https://example.com/track" metadata={metadata} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("registers with global mini-player when postId and username are provided", () => {
    render(
      <AudioPlayer
        {...defaultProps}
        postId={42}
        username="alice"
        text="Great song"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(mockPlay).toHaveBeenCalledWith({
      src: "https://example.com/track.mp3",
      postId: 42,
      username: "alice",
      text: "Great song",
    });
  });

  it("renders audio progress slider", () => {
    render(<AudioPlayer {...defaultProps} />);
    expect(screen.getByRole("slider", { name: "Audio progress" })).toBeInTheDocument();
  });

  describe("audio event handlers", () => {
    const fireAudioEvent = (type: string) => {
      const audio = document.querySelector("audio")!;
      fireEvent(audio, new Event(type));
    };

    it("timeupdate updates currentTime display", () => {
      render(<AudioPlayer src="s" metadata={{ duration_seconds: 60 }} />);
      const audio = document.querySelector("audio") as HTMLAudioElement;
      Object.defineProperty(audio, "currentTime", { configurable: true, value: 15 });
      fireAudioEvent("timeupdate");
      // time display shows "0:15"
      expect(screen.getByText("0:15")).toBeInTheDocument();
    });

    it("loadedmetadata updates duration display", () => {
      render(<AudioPlayer src="s" />);
      const audio = document.querySelector("audio") as HTMLAudioElement;
      Object.defineProperty(audio, "duration", { configurable: true, value: 90 });
      fireAudioEvent("loadedmetadata");
      expect(screen.getByText("1:30")).toBeInTheDocument();
    });

    it("ended event flips state back to play", () => {
      render(<AudioPlayer src="s" />);
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      // After click, button becomes Pause
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
      fireAudioEvent("ended");
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });
  });

  describe("progress bar interactions", () => {
    it("clicking the progress bar seeks the audio", () => {
      render(<AudioPlayer src="s" metadata={{ duration_seconds: 100 }} />);
      const audio = document.querySelector("audio") as HTMLAudioElement;
      let seekedTo = -1;
      Object.defineProperty(audio, "currentTime", {
        configurable: true,
        get: () => 0,
        set: (v: number) => { seekedTo = v; },
      });
      const bar = screen.getByRole("slider", { name: "Audio progress" });
      jest.spyOn(bar, "getBoundingClientRect").mockReturnValue({
        left: 0, width: 100, top: 0, right: 100, bottom: 10, height: 10, x: 0, y: 0, toJSON: () => ({}),
      } as DOMRect);

      fireEvent.click(bar, { clientX: 40 });
      expect(seekedTo).toBe(40);
    });

    it("zero-duration click is a no-op", () => {
      render(<AudioPlayer src="s" />);
      const audio = document.querySelector("audio") as HTMLAudioElement;
      const setter = jest.fn();
      Object.defineProperty(audio, "currentTime", { configurable: true, set: setter, get: () => 0 });
      fireEvent.click(screen.getByRole("slider", { name: "Audio progress" }), { clientX: 10 });
      expect(setter).not.toHaveBeenCalled();
    });
  });
});
