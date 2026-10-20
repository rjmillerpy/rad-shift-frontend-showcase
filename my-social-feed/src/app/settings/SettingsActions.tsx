"use client";
import React from "react";

/** Save / Reset buttons and the "Settings saved!" notice at the foot of
    every settings page; each page passes its own accent colour and size. */

type Props = {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onReset: () => void;
  saveColors: { background: string; color: string };
  resetLabel?: string;
  size?: "regular" | "small";
  fontFamily?: string;
  marginTop?: number;
};

const SIZES = {
  regular: { padding: "10px 24px", borderRadius: 6, fontSize: 14, noticeSize: 13 },
  small: { padding: "8px 20px", borderRadius: 4, fontSize: 12, noticeSize: 12 },
};
const RESET_GREY = "#6c757d";
const SAVED_GREEN = "#28a745";

export default function SettingsActions({
  saving, saved, onSave, onReset, saveColors, resetLabel = "Reset to Defaults",
  size = "regular", fontFamily, marginTop = 16,
}: Readonly<Props>) {
  const { noticeSize, ...button } = SIZES[size];
  const base: React.CSSProperties = { ...button, border: "none", cursor: "pointer" };
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginTop }}>
        <button onClick={onSave} disabled={saving} style={{ ...base, ...saveColors, fontFamily }}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <button onClick={onReset} style={{ ...base, background: RESET_GREY, color: "#fff" }}>
          {resetLabel}
        </button>
      </div>
      {saved && <p style={{ color: SAVED_GREEN, marginTop: 8, fontSize: noticeSize }}>Settings saved!</p>}
    </>
  );
}
