"use client";
import React from "react";

interface CodePanelProps {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  language?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  actions?: React.ReactNode;
  active?: boolean;
}

const S = { accent: "#6c5ce7", border: "#23232f", bg: "#1a1a24", header: "#111118", text: "#e0e0e0", dim: "#888" };

export default function CodePanel({ label, icon, value, onChange, collapsed = false, onToggleCollapse, actions, active = false }: CodePanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${active ? S.accent : S.border}`, borderRadius: 8, overflow: "hidden", minHeight: collapsed ? "auto" : 200, background: S.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: active ? S.accent : S.header, borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: S.text }}>
          <span>{icon}</span><span>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"}
              style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>
              {collapsed ? "\u25B6" : "\u25BC"}
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false}
          style={{ flex: 1, width: "100%", padding: "10px 12px", background: S.bg, color: S.text, border: "none", outline: "none", resize: "none", fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6, boxSizing: "border-box", minHeight: 160 }}
        />
      )}
    </div>
  );
}
