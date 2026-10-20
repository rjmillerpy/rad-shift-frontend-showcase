"use client";
import React from "react";
import { TOOLBAR } from "./constants";

type Props = {
  onInsert: (text: string, wrap: boolean) => void;
};

export default function EditorToolbar({ onInsert }: Props) {
  const insert = (cmd: string) => {
    if (cmd === "a") onInsert('<a href="">', false);
    else if (cmd === "img") onInsert('<img src="" alt="" />', false);
    else if (cmd === "hr") onInsert("<hr />", false);
    else if (cmd === "ul") onInsert("<ul>\n  <li></li>\n</ul>", false);
    else onInsert(cmd, true);
  };

  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 4, flexWrap: "wrap", background: "#f0f0f0", padding: 4, borderRadius: "6px 6px 0 0" }}>
      {TOOLBAR.map((btn) => (
        <button
          key={btn.cmd}
          data-testid={`toolbar-${btn.cmd}`}
          title={btn.label}
          onClick={() => insert(btn.cmd)}
          style={{
            padding: "4px 8px", border: "1px solid #ccc", borderRadius: 3, background: "#fff",
            cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, ...btn.style,
          }}
        >
          <span>{btn.icon}</span>
          <span style={{ fontSize: 10, color: "#666" }}>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
