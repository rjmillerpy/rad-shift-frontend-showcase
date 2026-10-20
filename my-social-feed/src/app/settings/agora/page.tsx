"use client";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import SettingsActions from "../SettingsActions";
import { CheckboxSettings, RangeSetting } from "../SettingsControls";
import { useSettings } from "../useSettings";

interface AgoraSettings {
  posts_per_page: number;
  sort_by: string;
  show_avatars: boolean;
  show_signatures: boolean;
  show_post_counts: boolean;
  show_join_dates: boolean;
  highlight_op: boolean;
  compact_mode: boolean;
  theme: string;
}

const DEFAULTS: AgoraSettings = {
  posts_per_page: 20,
  sort_by: "algo",
  show_avatars: true,
  show_signatures: true,
  show_post_counts: true,
  show_join_dates: true,
  highlight_op: true,
  compact_mode: false,
  theme: "classic",
};

export default function AgoraSettingsPage() {
  const { token, settings, setSettings, loading, saving, saved, save, reset } = useSettings("agora", DEFAULTS);

  if (!token) return <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}><p>Please <a href="/login">log in</a>.</p></div>;
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto", fontFamily: "'Verdana', sans-serif", fontSize: 13 }}>
      <FloatingButtons hideComposer />
      <Link href="/agora" style={{ color: "#2d5f4a", textDecoration: "none", fontSize: 12 }}>&larr; Back to Agora</Link>

      <h2 style={{ marginTop: 16, color: "#2d5f4a" }}>Agora Settings</h2>

      <h3 style={{ fontSize: 14, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Layout</h3>

      <RangeSetting
        label="Posts per page"
        display={settings.posts_per_page}
        value={settings.posts_per_page}
        min={10}
        max={50}
        step={5}
        onChange={(v) => setSettings((p) => ({ ...p, posts_per_page: v }))}
        testId="slider-posts-per-page"
        fontSize={13}
      />

      <h3 style={{ fontSize: 14, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 20 }}>Default Sort</h3>
      {(["algo", "most_liked", "most_discussed"] as const).map((s) => (
        <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input type="radio" name="sort_by" value={s} checked={settings.sort_by === s}
            onChange={() => setSettings((p) => ({ ...p, sort_by: s }))} data-testid={`sort-${s}`} />
          <span style={{ textTransform: "capitalize" }}>{s.replace("_", " ")}</span>
        </label>
      ))}

      <h3 style={{ fontSize: 14, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 20 }}>Theme</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["classic", "dark", "retro", "modern"] as const).map((t) => (
          <button key={t} onClick={() => setSettings((p) => ({ ...p, theme: t }))} data-testid={`theme-${t}`}
            style={{
              padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 12, textTransform: "capitalize",
              border: settings.theme === t ? "2px solid #2d5f4a" : "1px solid #ccc",
              background: t === "classic" ? "#e8e0d0" : t === "dark" ? "#1a1a2e" : t === "retro" ? "#c0d8c0" : "#fff",
              color: t === "dark" ? "#e0e0e0" : "#333",
            }}>
            {t}
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 20 }}>Display</h3>
      <CheckboxSettings
        options={[
          { key: "show_avatars", label: "Show user avatars" },
          { key: "show_post_counts", label: "Show post counts" },
          { key: "show_join_dates", label: "Show join dates" },
          { key: "highlight_op", label: "Highlight original poster" },
          { key: "compact_mode", label: "Compact mode (smaller rows)" },
        ] as const}
        isChecked={(key) => settings[key]}
        onChange={(key, checked) => setSettings((prev) => ({ ...prev, [key]: checked }))}
        fontSize={13}
        spacing={10}
      />

      <SettingsActions saving={saving} saved={saved} onSave={save} onReset={reset} saveColors={{ background: "#2d5f4a", color: "#fff" }} size="small" resetLabel="Reset" marginTop={20} />
    </div>
  );
}
