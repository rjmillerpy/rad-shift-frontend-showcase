import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  useGlobalAudio,
  useGlobalAudioManager,
  GlobalAudioContext,
} from "@/hooks/useGlobalAudio";
import type { NowPlayingTrack } from "@/hooks/useGlobalAudio";

// Mock HTMLMediaElement methods since jsdom doesn't support media
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: mockPlay,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: mockPause,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value: jest.fn(),
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

const sampleTrack: NowPlayingTrack = {
  src: "https://example.com/audio.mp3",
  postId: 1,
  username: "testuser",
  text: "Test track",
};

describe("useGlobalAudio (context consumer)", () => {
  it("returns default state when used outside provider", () => {
    const { result } = renderHook(() => useGlobalAudio());

    expect(result.current.track).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(typeof result.current.play).toBe("function");
    expect(typeof result.current.pause).toBe("function");
    expect(typeof result.current.resume).toBe("function");
    expect(typeof result.current.seekTo).toBe("function");
    expect(typeof result.current.stop).toBe("function");
  });
});

describe("useGlobalAudioManager", () => {
  it("returns default state", () => {
    const { result } = renderHook(() => useGlobalAudioManager());

    expect(result.current.track).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });

  it("play() sets track and isPlaying", () => {
    const { result } = renderHook(() => useGlobalAudioManager());

    // Wire up an audio element via _setAudioRef
    const audio = document.createElement("audio");
    const manager = result.current as ReturnType<typeof useGlobalAudioManager> & {
      _setAudioRef: (el: HTMLAudioElement | null) => void;
    };
    act(() => {
      manager._setAudioRef(audio);
    });

    act(() => {
      result.current.play(sampleTrack);
    });

    expect(result.current.track).toEqual(sampleTrack);
    expect(result.current.isPlaying).toBe(true);
    expect(mockPlay).toHaveBeenCalled();
  });

  it("pause() sets isPlaying to false", () => {
    const { result } = renderHook(() => useGlobalAudioManager());

    const audio = document.createElement("audio");
    const manager = result.current as ReturnType<typeof useGlobalAudioManager> & {
      _setAudioRef: (el: HTMLAudioElement | null) => void;
    };
    act(() => {
      manager._setAudioRef(audio);
    });

    act(() => {
      result.current.play(sampleTrack);
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPlaying).toBe(false);
    expect(mockPause).toHaveBeenCalled();
  });

  it("stop() clears track and resets state", () => {
    const { result } = renderHook(() => useGlobalAudioManager());

    const audio = document.createElement("audio");
    const manager = result.current as ReturnType<typeof useGlobalAudioManager> & {
      _setAudioRef: (el: HTMLAudioElement | null) => void;
    };
    act(() => {
      manager._setAudioRef(audio);
    });

    act(() => {
      result.current.play(sampleTrack);
    });
    expect(result.current.track).not.toBeNull();

    act(() => {
      result.current.stop();
    });

    expect(result.current.track).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });

  it("resume() calls play on audio element and sets isPlaying", () => {
    const { result } = renderHook(() => useGlobalAudioManager());

    const audio = document.createElement("audio");
    const manager = result.current as ReturnType<typeof useGlobalAudioManager> & {
      _setAudioRef: (el: HTMLAudioElement | null) => void;
    };
    act(() => {
      manager._setAudioRef(audio);
    });

    act(() => {
      result.current.resume();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(mockPlay).toHaveBeenCalled();
  });

  it("seekTo() updates currentTime", () => {
    const { result } = renderHook(() => useGlobalAudioManager());

    const audio = document.createElement("audio");
    const manager = result.current as ReturnType<typeof useGlobalAudioManager> & {
      _setAudioRef: (el: HTMLAudioElement | null) => void;
    };
    act(() => {
      manager._setAudioRef(audio);
    });

    act(() => {
      result.current.seekTo(42);
    });

    expect(result.current.currentTime).toBe(42);
  });

  test.each([
    { desc: "play new track", action: "play" as const },
    { desc: "pause", action: "pause" as const },
    { desc: "resume", action: "resume" as const },
    { desc: "stop", action: "stop" as const },
  ])("$desc does not throw without audio ref", ({ action }) => {
    const { result } = renderHook(() => useGlobalAudioManager());

    expect(() => {
      act(() => {
        if (action === "play") {
          result.current.play(sampleTrack);
        } else {
          result.current[action]();
        }
      });
    }).not.toThrow();
  });
});
