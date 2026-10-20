"use client";
import React from "react";
import { OPTIMAL_TIMES } from "./constants";

type ShareLinks = {
  twitter: string;
  facebook: string;
  linkedin: string;
};

type MonetizationProps = {
  monetized: boolean;
  onMonetizedChange: (v: boolean) => void;
  adPlacement: string;
  onAdPlacementChange: (v: string) => void;
};

export function MonetizationPanel({
  monetized, onMonetizedChange, adPlacement, onAdPlacementChange,
}: MonetizationProps) {
  return (
    <div style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Monetization</h3>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input data-testid="monetize-toggle" type="checkbox" checked={monetized}
          onChange={(e) => onMonetizedChange(e.target.checked)} />
        <span style={{ fontSize: 14 }}>Monetize this post (earn from ads + subscription pool)</span>
      </label>
      {monetized && (
        <div data-testid="ad-options">
          <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Ad placement:</p>
          {(["minimal", "standard"] as const).map((opt) => (
            <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="radio" name="ad_placement" value={opt} checked={adPlacement === opt}
                onChange={() => onAdPlacementChange(opt)} data-testid={`ad-${opt}`} />
              <span style={{ fontSize: 14 }}>
                {opt === "minimal" ? "Minimal (top + bottom)" : "Standard (top + inline + bottom)"}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

type SocialSharingProps = {
  autoShare: boolean;
  onAutoShareChange: (v: boolean) => void;
  shareLinks: ShareLinks;
};

export function SocialSharingPanel({ autoShare, onAutoShareChange, shareLinks }: SocialSharingProps) {
  return (
    <div style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Social Sharing</h3>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input data-testid="auto-share" type="checkbox" checked={autoShare}
          onChange={(e) => onAutoShareChange(e.target.checked)} />
        <span style={{ fontSize: 14 }}>Auto-share on publish</span>
      </label>
      {autoShare && (
        <div data-testid="share-links" style={{ fontSize: 12, color: "#666" }}>
          <p style={{ margin: "0 0 4px 0" }}>Share links (generated on publish):</p>
          <div>Twitter: <a href={shareLinks.twitter} target="_blank" rel="noopener" style={{ color: "#007bff" }}>Share</a></div>
          <div>Facebook: <a href={shareLinks.facebook} target="_blank" rel="noopener" style={{ color: "#007bff" }}>Share</a></div>
          <div>LinkedIn: <a href={shareLinks.linkedin} target="_blank" rel="noopener" style={{ color: "#007bff" }}>Share</a></div>
        </div>
      )}
    </div>
  );
}

type SchedulerProps = {
  scheduleEnabled: boolean;
  onScheduleEnabledChange: (v: boolean) => void;
  scheduleDate: string;
  onScheduleDateChange: (v: string) => void;
  scheduleTime: string;
  onScheduleTimeChange: (v: string) => void;
};

export function SchedulerPanel({
  scheduleEnabled, onScheduleEnabledChange, scheduleDate, onScheduleDateChange,
  scheduleTime, onScheduleTimeChange,
}: SchedulerProps) {
  return (
    <div style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Schedule</h3>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input data-testid="schedule-toggle" type="checkbox" checked={scheduleEnabled}
          onChange={(e) => onScheduleEnabledChange(e.target.checked)} />
        <span style={{ fontSize: 14 }}>Schedule for later</span>
      </label>
      {scheduleEnabled && (
        <div data-testid="schedule-options">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input data-testid="schedule-date" type="date" value={scheduleDate}
              onChange={(e) => onScheduleDateChange(e.target.value)}
              style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 4 }} />
            <input data-testid="schedule-time" type="time" value={scheduleTime}
              onChange={(e) => onScheduleTimeChange(e.target.value)}
              style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 4 }} />
          </div>
          <p style={{ fontSize: 12, color: "#888", margin: "8px 0 4px 0" }}>Optimal posting times:</p>
          {OPTIMAL_TIMES.map((t) => (
            <div key={t.day} style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
              <strong>{t.day} {t.time}</strong> — {t.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
