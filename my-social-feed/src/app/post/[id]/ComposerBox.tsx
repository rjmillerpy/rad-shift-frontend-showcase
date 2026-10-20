"use client";
import React from "react";

/** The frame the post page's quote and reply composers share: a tinted box
    with a title, the text area and Post / Cancel. The composers supply the
    wording, the accent colour and what Post does. */

type Props = {
  /** "quote" or "reply": prefixes the data-testids (quote-composer, quote-input, quote-submit). */
  kind: string;
  title: string;
  accent: string;
  tint: string;
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  submitLabel: string;
  onSubmit: () => void;
  onClose: () => void;
  /** Shown between the title and the text area (the quoted post's preview). */
  children?: React.ReactNode;
};

const BUTTON: React.CSSProperties = { padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" };

export default function ComposerBox({
  kind, title, accent, tint, value, onChange, placeholder, submitLabel, onSubmit, onClose, children,
}: Readonly<Props>) {
  return (
    <div data-testid={`${kind}-composer`} style={{ marginTop: "16px", padding: "12px", border: `2px solid ${accent}`, borderRadius: "8px", background: tint }}>
      <h4 style={{ margin: "0 0 8px 0" }}>{title}</h4>
      {children}
      <textarea
        data-testid={`${kind}-input`}
        aria-label={title}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", minHeight: "60px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" }}
        autoFocus
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button data-testid={`${kind}-submit`} onClick={onSubmit} style={{ ...BUTTON, background: accent, color: "#fff" }}>
          {submitLabel}
        </button>
        <button onClick={onClose} style={{ ...BUTTON, background: "#ccc" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
