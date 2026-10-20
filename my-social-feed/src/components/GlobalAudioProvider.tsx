"use client";
import React from "react";
import { GlobalAudioContext, useGlobalAudioManager } from "@/hooks/useGlobalAudio";

type Props = { children: React.ReactNode };

export default function GlobalAudioProvider({ children }: Props) {
  const manager = useGlobalAudioManager() as ReturnType<typeof useGlobalAudioManager> & {
    _setAudioRef: (el: HTMLAudioElement | null) => void;
  };

  return (
    <GlobalAudioContext.Provider value={manager}>
      <audio ref={manager._setAudioRef} style={{ display: "none" }} />
      {children}
    </GlobalAudioContext.Provider>
  );
}
