"use client";
import { UNSTYLED_BUTTON } from "@/lib/a11y";
import { useState } from "react";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import SettingsActions from "../SettingsActions";
import { RangeSetting } from "../SettingsControls";
import { useSettings } from "../useSettings";

interface AlgoSettings {
  engagement_enabled: boolean;
  like_weight: number;
  repost_weight: number;
  share_weight: number;
  laugh_weight: number;
  save_weight: number;
  slop_weight: number;
  recency_weight: number;
  randomness: number;
  interest_adaptation: number;
  category_diversity: number;
  show_followed_boost: boolean;
  hide_seen_posts: boolean;
  preferred_categories: string[];
  blocked_categories: string[];
  slop_filter: string;
  slop_threshold: number;
}

const DEFAULTS: AlgoSettings = {
  engagement_enabled: true,
  like_weight: 1.0,
  repost_weight: 1.0,
  share_weight: 1.0,
  laugh_weight: 0.5,
  save_weight: 0.5,
  slop_weight: 0.0,
  recency_weight: 0.3,
  randomness: 0.1,
  interest_adaptation: 0.5,
  category_diversity: 0.5,
  show_followed_boost: true,
  hide_seen_posts: false,
  preferred_categories: [],
  blocked_categories: [],
  slop_filter: "hide",
  slop_threshold: 0,
};

export default function AlgoSettingsPage() {
  const { token, settings, setSettings, loading, saving, saved, save, reset } = useSettings("algo", DEFAULTS);
  const [categoryInput, setCategoryInput] = useState("");
  const [blockInput, setBlockInput] = useState("");

  const setWeight = (key: keyof AlgoSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: Math.round(value * 100) / 100 }));
  };

  const addCategory = (list: "preferred_categories" | "blocked_categories", input: string, setInput: (v: string) => void) => {
    const cat = input.trim().toLowerCase();
    if (!cat) return;
    setSettings((prev) => ({
      ...prev,
      [list]: [...(prev[list] as string[]).filter((c) => c !== cat), cat],
    }));
    setInput("");
  };

  const removeCategory = (list: "preferred_categories" | "blocked_categories", cat: string) => {
    setSettings((prev) => ({
      ...prev,
      [list]: (prev[list] as string[]).filter((c) => c !== cat),
    }));
  };

  if (!token) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <p>Please <a href="/login">log in</a> to manage algorithm settings.</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Loading settings...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <FloatingButtons hideComposer />
      <Link href="/" style={{ color: "#007bff", textDecoration: "none", fontSize: 14 }}>&larr; Back to feed</Link>

      <h2 style={{ marginTop: 16 }}>Algorithm Settings</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>
        Control how posts are ranked in your feed. These settings apply across all feed types.
      </p>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Engagement Weights</h3>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={settings.engagement_enabled}
          onChange={(e) => setSettings((prev) => ({ ...prev, engagement_enabled: e.target.checked }))}
          data-testid="toggle-engagement-enabled"
        />
        <span style={{ fontSize: 14, fontWeight: "bold" }}>Enable engagement-based ranking</span>
      </label>
      {settings.engagement_enabled ? (
        <>
          <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>How much each interaction type affects post ranking (0 = ignore, 2 = double weight)</p>
          <RangeSetting label="Likes" display={settings.like_weight.toFixed(1)} value={settings.like_weight} min={0} max={2} step={0.1} onChange={(v) => setWeight("like_weight", v)} testId="slider-like_weight" />
          <RangeSetting label="Reposts" display={settings.repost_weight.toFixed(1)} value={settings.repost_weight} min={0} max={2} step={0.1} onChange={(v) => setWeight("repost_weight", v)} testId="slider-repost_weight" />
          <RangeSetting label="Shares" display={settings.share_weight.toFixed(1)} value={settings.share_weight} min={0} max={2} step={0.1} onChange={(v) => setWeight("share_weight", v)} testId="slider-share_weight" />
          <RangeSetting label="Laughs" display={settings.laugh_weight.toFixed(1)} value={settings.laugh_weight} min={0} max={2} step={0.1} onChange={(v) => setWeight("laugh_weight", v)} testId="slider-laugh_weight" />
          <RangeSetting label="Saves" display={settings.save_weight.toFixed(1)} value={settings.save_weight} min={0} max={2} step={0.1} onChange={(v) => setWeight("save_weight", v)} testId="slider-save_weight" />
          <RangeSetting label="Slop penalty (higher = hide slopped posts more)" display={settings.slop_weight.toFixed(1)} value={settings.slop_weight} min={0} max={2} step={0.1} onChange={(v) => setWeight("slop_weight", v)} testId="slider-slop_weight" />
        </>
      ) : (
        <p style={{ color: "#999", fontSize: 13, fontStyle: "italic" }}>
          Posts will be ordered by recency only.
        </p>
      )}

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Feed Tuning</h3>
      <RangeSetting label="Recency Boost" display={settings.recency_weight.toFixed(1)} value={settings.recency_weight} min={0} max={1} step={0.05} onChange={(v) => setWeight("recency_weight", v)} testId="slider-recency_weight" />
      <RangeSetting label="Randomness" display={settings.randomness.toFixed(1)} value={settings.randomness} min={0} max={1} step={0.05} onChange={(v) => setWeight("randomness", v)} testId="slider-randomness" />
      <RangeSetting label="Interest Adaptation" display={settings.interest_adaptation.toFixed(1)} value={settings.interest_adaptation} min={0} max={1} step={0.05} onChange={(v) => setWeight("interest_adaptation", v)} testId="slider-interest_adaptation" />
      <RangeSetting label="Category Diversity" display={settings.category_diversity.toFixed(1)} value={settings.category_diversity} min={0} max={1} step={0.05} onChange={(v) => setWeight("category_diversity", v)} testId="slider-category_diversity" />

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Toggles</h3>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={settings.show_followed_boost}
          onChange={(e) => setSettings((prev) => ({ ...prev, show_followed_boost: e.target.checked }))}
          data-testid="toggle-followed-boost"
        />
        <span style={{ fontSize: 14 }}>Boost posts from people you follow</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={settings.hide_seen_posts}
          onChange={(e) => setSettings((prev) => ({ ...prev, hide_seen_posts: e.target.checked }))}
          data-testid="toggle-hide-seen"
        />
        <span style={{ fontSize: 14 }}>Hide posts you have already seen</span>
      </label>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Slop &amp; Report Filtering</h3>
      <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>Control how posts you&apos;ve marked as slop or reported are handled</p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input type="radio" name="slop_filter" value="hide" checked={settings.slop_filter === "hide"}
            onChange={() => setSettings((prev) => ({ ...prev, slop_filter: "hide" }))} data-testid="slop-filter-hide" />
          <span style={{ fontSize: 14 }}>Hide slopped/reported posts (default)</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input type="radio" name="slop_filter" value="dim" checked={settings.slop_filter === "dim"}
            onChange={() => setSettings((prev) => ({ ...prev, slop_filter: "dim" }))} data-testid="slop-filter-dim" />
          <span style={{ fontSize: 14 }}>Dim slopped posts but still show them</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input type="radio" name="slop_filter" value="show" checked={settings.slop_filter === "show"}
            onChange={() => setSettings((prev) => ({ ...prev, slop_filter: "show" }))} data-testid="slop-filter-show" />
          <span style={{ fontSize: 14 }}>Show everything (no filtering)</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input type="radio" name="slop_filter" value="only" checked={settings.slop_filter === "only"}
            onChange={() => setSettings((prev) => ({ ...prev, slop_filter: "only" }))} data-testid="slop-filter-only" />
          <span style={{ fontSize: 14 }}>Show only heavily-slopped posts (dive into the slop feed)</span>
        </label>
      </div>

      <RangeSetting
        label={settings.slop_filter === "only"
          ? "Minimum slop marks required (only posts with at least this many will show)"
          : "Community slop threshold (hide posts with this many slop marks from all users)"}
        display={settings.slop_threshold}
        value={settings.slop_threshold}
        min={0}
        max={20}
        step={1}
        onChange={(v) => setSettings((prev) => ({ ...prev, slop_threshold: v }))}
        testId="slider-slop-threshold"
        hints={[settings.slop_filter === "only" ? "1 (any slop)" : "0 (disabled)", "20"]}
      />

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Preferred Categories</h3>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <input type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Add category..." data-testid="preferred-input"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory("preferred_categories", categoryInput, setCategoryInput))}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4 }} />
        <button onClick={() => addCategory("preferred_categories", categoryInput, setCategoryInput)}
          style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Add</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {settings.preferred_categories.map((cat) => (
          <button type="button" key={cat} aria-label={`Remove ${cat}`} style={{ ...UNSTYLED_BUTTON, background: "#e8f5e9", padding: "2px 8px", borderRadius: 12, fontSize: 12 }}
            onClick={() => removeCategory("preferred_categories", cat)} data-testid={`pref-${cat}`}>
            {cat} ✕
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Blocked Categories</h3>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <input type="text" value={blockInput} onChange={(e) => setBlockInput(e.target.value)}
          placeholder="Block category..." data-testid="blocked-input"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory("blocked_categories", blockInput, setBlockInput))}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4 }} />
        <button onClick={() => addCategory("blocked_categories", blockInput, setBlockInput)}
          style={{ padding: "6px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Block</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 24 }}>
        {settings.blocked_categories.map((cat) => (
          <button type="button" key={cat} aria-label={`Remove ${cat}`} style={{ ...UNSTYLED_BUTTON, background: "#fce4ec", padding: "2px 8px", borderRadius: 12, fontSize: 12 }}
            onClick={() => removeCategory("blocked_categories", cat)} data-testid={`block-${cat}`}>
            {cat} ✕
          </button>
        ))}
      </div>

      <SettingsActions saving={saving} saved={saved} onSave={save} onReset={reset} saveColors={{ background: "#007bff", color: "#fff" }} />
    </div>
  );
}
