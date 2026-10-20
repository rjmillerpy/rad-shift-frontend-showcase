"use client";
import { createContext, useContext, useCallback, useRef, useState } from "react";

export type NowPlayingTrack = {
  src: string;
  postId: number;
  username: string;
  text: string;
};

type GlobalAudioState = {
  track: NowPlayingTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (track: NowPlayingTrack) => void;
  pause: () => void;
  resume: () => void;
  seekTo: (time: number) => void;
  stop: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const NOOP = () => {};

const DEFAULT_STATE: GlobalAudioState = {
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: NOOP,
  pause: NOOP,
  resume: NOOP,
  seekTo: NOOP,
  stop: NOOP,
  audioRef: { current: null },
};

export const GlobalAudioContext = createContext<GlobalAudioState>(DEFAULT_STATE);

export function useGlobalAudio(): GlobalAudioState {
  return useContext(GlobalAudioContext);
}

/**
 * Hook that owns the actual audio element and state.
 * Used once in the provider — not directly by consumers.
 */
export function useGlobalAudioManager(): GlobalAudioState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<NowPlayingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((newTrack: NowPlayingTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If same track, just resume
    if (track?.src === newTrack.src) {
      audio.play().catch((err) => console.error("Audio resume failed:", err));
      setIsPlaying(true);
      return;
    }

    setTrack(newTrack);
    audio.src = newTrack.src;
    audio.load();
    audio.play().catch((err) => console.error("Audio play failed:", err));
    setIsPlaying(true);
  }, [track]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch((err) => console.error("Audio resume failed:", err));
    setIsPlaying(true);
  }, []);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Attach event listeners when audioRef is set
  const setAudioRef = useCallback((el: HTMLAudioElement | null) => {
    // Clean up old listeners
    const prev = audioRef.current;
    if (prev) {
      prev.ontimeupdate = null;
      prev.onloadedmetadata = null;
      prev.onended = null;
    }

    audioRef.current = el;

    if (el) {
      el.ontimeupdate = () => setCurrentTime(el.currentTime);
      el.onloadedmetadata = () => {
        if (el.duration && Number.isFinite(el.duration)) setDuration(el.duration);
      };
      el.onended = () => setIsPlaying(false);
    }
  }, []);

  return {
    track,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    resume,
    seekTo,
    stop,
    audioRef: { current: audioRef.current } as React.RefObject<HTMLAudioElement | null>,
    // Expose setAudioRef for the provider to wire up
    ...({ _setAudioRef: setAudioRef } as Record<string, unknown>),
  } as GlobalAudioState & { _setAudioRef: (el: HTMLAudioElement | null) => void };
}
