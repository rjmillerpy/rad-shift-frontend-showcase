"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import type { MediaMetadata } from "@/types/post";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { formatMediaTime } from "@/lib/utils";

type AudioPlayerProps = {
  src: string;
  postId?: number;
  username?: string;
  text?: string;
  metadata?: MediaMetadata | null;
  onPlay?: () => void;
};

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function AudioPlayer({ src, postId, username, text, metadata, onPlay }: AudioPlayerProps) {
  const globalAudio = useGlobalAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(metadata?.duration_seconds ?? 0);
  const [volume, setVolume] = useState(1);
  const [speedIndex, setSpeedIndex] = useState(2); // 1x default
  const [isDragging, setIsDragging] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      globalAudio.pause();
    } else {
      onPlay?.();
      audio.play().catch((err) => console.error("Audio play failed:", err));

      // Register with global mini-player if post context is available
      if (postId && username) {
        globalAudio.play({ src, postId, username, text: text ?? "" });
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, onPlay, globalAudio, src, postId, username, text]);

  const seekTo = useCallback((clientX: number) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;

    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = fraction * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    seekTo(e.clientX);
  }, [seekTo]);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => seekTo(e.clientX);
    const onUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, seekTo]);

  const cycleSpeed = useCallback(() => {
    const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIndex);
    if (audioRef.current) {
      audioRef.current.playbackRate = PLAYBACK_SPEEDS[nextIndex];
    }
  }, [speedIndex]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  return (
    <div
      style={{
        background: "#1a1a2e",
        borderRadius: 10,
        padding: "12px 16px",
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{
            background: "#6c5ce7",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#fff",
            fontSize: 16,
          }}
        >
          {isPlaying ? "\u275A\u275A" : "\u25B6"}
        </button>

        {/* Time */}
        <span style={{ fontSize: 12, color: "#aaa", minWidth: 36, fontFamily: "monospace" }}>
          {formatMediaTime(currentTime)}
        </span>

        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
          role="slider"
          aria-label="Audio progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          style={{
            flex: 1,
            height: 6,
            background: "#2d2d4a",
            borderRadius: 3,
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #6c5ce7, #a29bfe)",
              borderRadius: 3,
              transition: isDragging ? "none" : "width 0.1s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${progress}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 0 4px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {/* Duration */}
        <span style={{ fontSize: 12, color: "#aaa", minWidth: 36, fontFamily: "monospace" }}>
          {formatMediaTime(duration)}
        </span>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          title="Playback speed"
          style={{
            background: "#2d2d4a",
            border: "none",
            borderRadius: 4,
            padding: "2px 6px",
            color: "#a29bfe",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "monospace",
            minWidth: 32,
          }}
        >
          {PLAYBACK_SPEEDS[speedIndex]}x
        </button>

        {/* Volume */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          style={{ width: 60, accentColor: "#6c5ce7" }}
        />
      </div>

      {/* Metadata line */}
      {metadata && (
        <div style={{ fontSize: 11, color: "#666", display: "flex", gap: 12 }}>
          {metadata.format && <span>{metadata.format.toUpperCase()}</span>}
          {metadata.bitrate && <span>{Math.round(metadata.bitrate / 1000)} kbps</span>}
          {metadata.sample_rate && <span>{(metadata.sample_rate / 1000).toFixed(1)} kHz</span>}
        </div>
      )}
    </div>
  );
}

export default React.memo(AudioPlayer);
