"use client";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import SettingsActions from "../SettingsActions";
import { CheckboxSettings, RangeSetting } from "../SettingsControls";
import { useSettings } from "../useSettings";

interface ChronicleSettings {
  posts_per_page: number;
  narrative_style: string;
  show_media_inline: boolean;
  show_engagement_in_tooltip: boolean;
  cache_duration_hours: number;
  title_prompt_enabled: boolean;
  auto_advance: boolean;
  font_size: number;
  line_height: number;
  theme: string;
}

const DEFAULTS: ChronicleSettings = {
  posts_per_page: 8,
  narrative_style: "literary",
  show_media_inline: true,
  show_engagement_in_tooltip: true,
  cache_duration_hours: 1,
  title_prompt_enabled: true,
  auto_advance: false,
  font_size: 16,
  line_height: 1.8,
  theme: "parchment",
};

export default function ChronicleSettingsPage() {
  const { token, settings, setSettings, loading, saving, saved, save, reset } = useSettings("chronicle", DEFAULTS);

  if (!token) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <p>Please <a href="/login">log in</a> to manage chronicle settings.</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Loading settings...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <FloatingButtons hideComposer />
      <Link href="/chronicle" style={{ color: "#5c3d2e", textDecoration: "none", fontSize: 14 }}>&larr; Back to chronicle</Link>

      <h2 style={{ marginTop: 16, fontFamily: "'Georgia', serif", color: "#3c2415" }}>Chronicle Settings</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>
        Customize how your chronicle reads and feels.
      </p>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Reading Experience</h3>

      <RangeSetting
        label="Font Size"
        display={<>{settings.font_size}px</>}
        value={settings.font_size}
        min={12}
        max={24}
        step={1}
        onChange={(v) => setSettings((prev) => ({ ...prev, font_size: v }))}
        testId="slider-font-size"
      />

      <RangeSetting
        label="Line Height"
        display={settings.line_height.toFixed(1)}
        value={settings.line_height}
        min={1.2}
        max={2.4}
        step={0.1}
        onChange={(v) => setSettings((prev) => ({ ...prev, line_height: v }))}
        testId="slider-line-height"
      />

      <RangeSetting
        label="Posts per Chapter"
        display={settings.posts_per_page}
        value={settings.posts_per_page}
        min={4}
        max={16}
        step={1}
        onChange={(v) => setSettings((prev) => ({ ...prev, posts_per_page: v }))}
        testId="slider-posts-per-page"
      />

      <RangeSetting
        label="Cache Duration (hours)"
        display={settings.cache_duration_hours}
        value={settings.cache_duration_hours}
        min={0}
        max={24}
        step={1}
        onChange={(v) => setSettings((prev) => ({ ...prev, cache_duration_hours: v }))}
        testId="slider-cache-duration"
        hints={["0 (always fresh)", "24 hours"]}
      />

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Narrative Style</h3>

      <div style={{ marginBottom: 16 }}>
        {(["literary", "casual", "journalistic", "poetic"] as const).map((style) => (
          <label key={style} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input type="radio" name="narrative_style" value={style}
              checked={settings.narrative_style === style}
              onChange={() => setSettings((prev) => ({ ...prev, narrative_style: style }))}
              data-testid={`style-${style}`} />
            <span style={{ fontSize: 14, textTransform: "capitalize" }}>{style}</span>
          </label>
        ))}
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Theme</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["parchment", "dark", "sepia", "modern"] as const).map((theme) => (
          <button key={theme}
            onClick={() => setSettings((prev) => ({ ...prev, theme }))}
            data-testid={`theme-${theme}`}
            style={{
              padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, textTransform: "capitalize",
              border: settings.theme === theme ? "2px solid #5c3d2e" : "1px solid #ccc",
              background: theme === "parchment" ? "#f5f0e8" : theme === "dark" ? "#1a1a2e" : theme === "sepia" ? "#d4a574" : "#fff",
              color: theme === "dark" ? "#e0e0e0" : "#333",
            }}>
            {theme}
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Display Options</h3>

      <CheckboxSettings
        options={[
          { key: "show_media_inline", label: "Show media (images, video, audio) inline in the narrative" },
          { key: "show_engagement_in_tooltip", label: "Show engagement stats in hover tooltip" },
          { key: "title_prompt_enabled", label: "Ask for a story title on each visit" },
          { key: "auto_advance", label: "Auto-advance to next page when finished reading" },
        ] as const}
        isChecked={(key) => settings[key]}
        onChange={(key, checked) => setSettings((prev) => ({ ...prev, [key]: checked }))}
      />

      <SettingsActions saving={saving} saved={saved} onSave={save} onReset={reset} saveColors={{ background: "#5c3d2e", color: "#f5f0e8" }} fontFamily="'Georgia', serif" marginTop={24} />
    </div>
  );
}
