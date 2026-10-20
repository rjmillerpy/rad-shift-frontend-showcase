"use client";
import { UNSTYLED_BUTTON } from "@/lib/a11y";
import { useState } from "react";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import SettingsActions from "../SettingsActions";
import { RangeSetting, CheckboxSettings } from "../SettingsControls";
import { useSettings } from "../useSettings";

interface BubbleSettings {
  animation_speed: number;
  bubble_density: number;
  show_media_previews: boolean;
  show_avatars: boolean;
  auto_drill_cooldown: number;
  color_saturation: number;
  show_connection_lines: boolean;
  custom_topics: string[];
  hidden_topics: string[];
  goal_prompt_enabled: boolean;
  focus_timer_enabled: boolean;
  depth_indicator_enabled: boolean;
}

const DEFAULTS: BubbleSettings = {
  animation_speed: 0.4,
  bubble_density: 16,
  show_media_previews: true,
  show_avatars: true,
  auto_drill_cooldown: 2000,
  color_saturation: 1.0,
  show_connection_lines: true,
  custom_topics: [],
  hidden_topics: [],
  goal_prompt_enabled: true,
  focus_timer_enabled: true,
  depth_indicator_enabled: true,
};

export default function BubbleSettingsPage() {
  const { token, settings, setSettings, loading, saving, saved, save, reset } = useSettings("bubble", DEFAULTS);
  const [topicInput, setTopicInput] = useState("");
  const [hideInput, setHideInput] = useState("");

  const addTopic = (list: "custom_topics" | "hidden_topics", input: string, setInput: (v: string) => void) => {
    const t = input.trim();
    if (!t) return;
    setSettings((prev) => ({
      ...prev,
      [list]: [...(prev[list] as string[]).filter((x) => x !== t), t],
    }));
    setInput("");
  };

  const removeTopic = (list: "custom_topics" | "hidden_topics", t: string) => {
    setSettings((prev) => ({
      ...prev,
      [list]: (prev[list] as string[]).filter((x) => x !== t),
    }));
  };

  if (!token) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <p>Please <a href="/login">log in</a> to manage bubble settings.</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Loading settings...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <FloatingButtons hideComposer />
      <Link href="/bubbles" style={{ color: "#007bff", textDecoration: "none", fontSize: 14 }}>&larr; Back to bubbles</Link>

      <h2 style={{ marginTop: 16 }}>Bubble Settings</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>
        Customize how bubbles look, feel, and behave.
      </p>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Animation &amp; Layout</h3>

      <RangeSetting
        label="Animation Speed"
        display={settings.animation_speed.toFixed(2)}
        value={settings.animation_speed}
        min={0.01}
        max={1}
        step={0.01}
        onChange={(v) => setSettings((prev) => ({ ...prev, animation_speed: v }))}
        testId="slider-animation-speed"
        hints={["Nearly still", "Fast drift"]}
      />

      <RangeSetting
        label="Bubble Density (orbit items)"
        display={settings.bubble_density}
        value={settings.bubble_density}
        min={6}
        max={30}
        step={1}
        onChange={(v) => setSettings((prev) => ({ ...prev, bubble_density: v }))}
        testId="slider-bubble-density"
        hints={["Sparse (6)", "Dense (30)"]}
      />

      <RangeSetting
        label="Drill Cooldown (ms)"
        display={settings.auto_drill_cooldown}
        value={settings.auto_drill_cooldown}
        min={0}
        max={5000}
        step={100}
        onChange={(v) => setSettings((prev) => ({ ...prev, auto_drill_cooldown: v }))}
        testId="slider-cooldown"
      />

      <RangeSetting
        label="Color Saturation"
        display={settings.color_saturation.toFixed(1)}
        value={settings.color_saturation}
        min={0}
        max={2}
        step={0.1}
        onChange={(v) => setSettings((prev) => ({ ...prev, color_saturation: v }))}
        testId="slider-saturation"
      />

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Display Options</h3>
      <CheckboxSettings
        options={[
          { key: "show_media_previews", label: "Show media previews in bubbles" },
          { key: "show_avatars", label: "Show profile avatars in text bubbles" },
          { key: "show_connection_lines", label: "Show constellation connection lines" },
        ] as const}
        isChecked={(key) => Boolean(settings[key])}
        onChange={(key, checked) => setSettings((prev) => ({ ...prev, [key]: checked }))}
      />

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Cognitive Features</h3>
      <CheckboxSettings
        options={[
          { key: "goal_prompt_enabled", label: "Show session goal prompt on start" },
          { key: "focus_timer_enabled", label: "Show focus timer" },
          { key: "depth_indicator_enabled", label: "Show depth indicator" },
        ] as const}
        isChecked={(key) => Boolean(settings[key])}
        onChange={(key, checked) => setSettings((prev) => ({ ...prev, [key]: checked }))}
      />

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4, marginTop: 24 }}>Custom Topics</h3>
      <p style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>Add custom topic bubbles to the overview</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <input type="text" value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
          placeholder="Add topic..." data-testid="custom-topic-input"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic("custom_topics", topicInput, setTopicInput))}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4 }} />
        <button onClick={() => addTopic("custom_topics", topicInput, setTopicInput)}
          style={{ padding: "6px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Add</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {settings.custom_topics.map((t) => (
          <button type="button" key={t} aria-label={`Remove ${t}`} style={{ ...UNSTYLED_BUTTON, background: "#e3f2fd", padding: "2px 8px", borderRadius: 12, fontSize: 12 }}
            onClick={() => removeTopic("custom_topics", t)} data-testid={`topic-${t}`}>
            {t} ✕
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 4 }}>Hidden Topics</h3>
      <p style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>Topics you don&apos;t want to see</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <input type="text" value={hideInput} onChange={(e) => setHideInput(e.target.value)}
          placeholder="Hide topic..." data-testid="hidden-topic-input"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic("hidden_topics", hideInput, setHideInput))}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4 }} />
        <button onClick={() => addTopic("hidden_topics", hideInput, setHideInput)}
          style={{ padding: "6px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Hide</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 24 }}>
        {settings.hidden_topics.map((t) => (
          <button type="button" key={t} aria-label={`Remove ${t}`} style={{ ...UNSTYLED_BUTTON, background: "#fce4ec", padding: "2px 8px", borderRadius: 12, fontSize: 12 }}
            onClick={() => removeTopic("hidden_topics", t)} data-testid={`hide-${t}`}>
            {t} ✕
          </button>
        ))}
      </div>

      <SettingsActions saving={saving} saved={saved} onSave={save} onReset={reset} saveColors={{ background: "#007bff", color: "#fff" }} />
    </div>
  );
}
