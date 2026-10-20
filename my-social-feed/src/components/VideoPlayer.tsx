"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { formatMediaTime } from "@/lib/utils";
import type { MediaMetadata } from "@/types/post";

type VideoPlayerProps = {
  src: string;
  metadata?: MediaMetadata | null;
};

function VideoPlayer({ src, metadata }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(metadata?.duration_seconds ?? 0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoaded = () => {
      if (video.duration && Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((err) => console.error("Video play failed:", err));
    } else {
      video.pause();
    }
    scheduleHide();
  }, [scheduleHide]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = e.currentTarget;
    if (!video || !duration) return;

    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = fraction * duration;
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Fullscreen exit may fail in some browsers — non-critical
      });
    } else {
      container.requestFullscreen().catch(() => {
        // Fullscreen may not be supported — non-critical
      });
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP not supported:", err);
    }
  }, []);

  const controlsOpacity = showControls ? 1 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={scheduleHide}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 10,
        background: "#000",
        maxWidth: "100%",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        preload="metadata"
        playsInline
        style={{
          width: "100%",
          display: "block",
          cursor: "pointer",
          maxHeight: isFullscreen ? "100vh" : 400,
          objectFit: "contain",
        }}
      />

      {/* Play overlay (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Play video"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            cursor: "pointer",
            color: "#fff",
            fontSize: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {"\u25B6"}
        </button>
      )}

      {/* Bottom controls bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          padding: "20px 12px 8px",
          opacity: controlsOpacity,
          transition: "opacity 0.3s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Progress bar */}
        <div
          onClick={handleProgressClick}
          role="slider"
          aria-label="Video progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          style={{
            height: 4,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 2,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#6c5ce7",
              borderRadius: 2,
            }}
          />
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isPlaying ? "\u275A\u275A" : "\u25B6"}
          </button>

          <span style={{ fontSize: 12, fontFamily: "monospace" }}>
            {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
          </span>

          <div style={{ flex: 1 }} />

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

          {/* PiP */}
          <button
            onClick={togglePiP}
            title="Picture-in-Picture"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              padding: 0,
            }}
          >
            PiP
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isFullscreen ? "\u2716" : "\u26F6"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(VideoPlayer);
