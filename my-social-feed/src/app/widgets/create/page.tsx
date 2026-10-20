"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { getTemplateForCategory, CATEGORY_MAP } from "@/lib/widgetTemplates";
import CodePanel from "@/components/CodePanel";
import { WIDGET_THEME } from "../theme";

type PanelId = "html" | "css" | "js" | "compute";

const CATEGORIES = Object.keys(CATEGORY_MAP);
const JS_LANGUAGES = ["javascript", "typescript", "react"];
const COMPUTE_LANGUAGES = ["python", "sql"];

// -- Starter code shown to a new widget author. Extracted so it's easy to
//    tweak without hunting through JSX and to make useState calls readable. --
const DEFAULT_HTML = '<div id="app">\n  <h1>Hello Widget</h1>\n  <button id="btn">Click me</button>\n  <div id="output"></div>\n</div>';
const DEFAULT_CSS = 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\nbutton { background: #0e639c; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }\n#output { margin-top: 12px; }';
const DEFAULT_JS = 'document.getElementById("btn").addEventListener("click", () => {\n  document.getElementById("output").textContent = "Button clicked! " + new Date().toLocaleTimeString();\n});';

/** Build the standalone document string used by both the live preview iframe
    and the payload sent to POST /widgets. Kept as one helper so preview and
    save never diverge. */
function buildWidgetDocument(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html><head><style>${css}</style></head>
<body>${html}
<script>${js}<\/script>
</body></html>`;
}

// -- Styles --
const { bg, card, border, accent, textPrimary, textSecondary } = WIDGET_THEME;
const inputStyle: React.CSSProperties = {
  padding: "8px 12px", background: "#1a1a24", border: `1px solid ${border}`,
  borderRadius: 6, color: textPrimary, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const,
};

export default function WidgetCreatePage() {
  const router = useRouter();

  // Panel content
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML);
  const [cssCode, setCssCode] = useState(DEFAULT_CSS);
  const [jsCode, setJsCode] = useState(DEFAULT_JS);
  const [computeCode, setComputeCode] = useState('');

  // Settings
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [jsLanguage, setJsLanguage] = useState('javascript');
  const [computeLanguage, setComputeLanguage] = useState('python');
  const [executionMode, setExecutionMode] = useState<'client' | 'server'>('client');
  const [showCompute, setShowCompute] = useState(false);

  // Panel collapse state
  const [collapsed, setCollapsed] = useState<Record<PanelId, boolean>>({ html: false, css: false, js: false, compute: false });
  const toggleCollapse = (id: PanelId) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  // Preview & execution
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [computeOutput, setComputeOutput] = useState('');
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Template data for the picker
  const categoryTemplates = useMemo(
    () => CATEGORIES.map((cat) => getTemplateForCategory(cat)),
    [],
  );

  const loadTemplate = useCallback((cat: string) => {
    const tpl = getTemplateForCategory(cat);
    setCategory(cat);
    setHtmlCode(tpl.html);
    setCssCode(tpl.css);
    setJsCode(tpl.js);
    if (tpl.compute) {
      setComputeCode(tpl.compute);
      setShowCompute(true);
      if (tpl.computeLanguage) setComputeLanguage(tpl.computeLanguage);
    } else {
      setShowCompute(false);
      setComputeCode('');
    }
    if (!title.trim()) setTitle(`${tpl.name} Widget`);
  }, [title]);

  const handlePreview = useCallback(() => {
    setPreviewHtml(buildWidgetDocument(htmlCode, cssCode, jsCode));
  }, [htmlCode, cssCode, jsCode]);

  const handleRunCompute = useCallback(async () => {
    setExecuting(true);
    try {
      const res = await api.post("/widgets/execute", {
        code: computeCode,
        language: computeLanguage,
      });
      setComputeOutput(res.data.stdout || res.data.stderr || JSON.stringify(res.data.results));
    } catch (e) {
      console.error("Execution failed:", e);
      // Surface the server's reason (e.g. 503 when server execution is disabled).
      const detail = axios.isAxiosError(e) ? e.response?.data?.detail : undefined;
      setComputeOutput(
        typeof detail === "string" ? detail : "Execution failed. Check the console for details.",
      );
    }
    setExecuting(false);
  }, [computeCode, computeLanguage]);

  const handleSave = async (submit: boolean) => {
    if (!title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const code = buildWidgetDocument(htmlCode, cssCode, jsCode);
      const body = {
        title: title.trim(),
        category: CATEGORY_MAP[category] || category,
        language: jsLanguage,
        code,
        css: cssCode || null,
        execution_mode: executionMode,
        compute_code: computeCode || null,
        compute_language: showCompute ? computeLanguage : null,
        submit_for_review: submit,
      };
      const res = await api.post("/widgets", body);
      const id = res.data.id ?? res.data.widget?.id;
      router.push(id ? `/widgets/${id}` : "/widgets");
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save widget");
    } finally {
      setSaving(false);
    }
  };

  const selStyle: React.CSSProperties = { ...inputStyle, width: "auto", minWidth: 100 };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "system-ui, sans-serif" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${border}`, background: card, flexWrap: "wrap" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Widget title..." style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={selStyle}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Execution mode toggle */}
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${border}` }}>
          {(["client", "server"] as const).map((m) => (
            <button key={m} onClick={() => setExecutionMode(m)} style={{
              padding: "6px 14px", fontSize: 13, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: executionMode === m ? accent : "#1a1a24", color: executionMode === m ? "#fff" : textSecondary,
            }}>
              {m === "client" ? "Client" : "Server"}
            </button>
          ))}
        </div>

        <button onClick={handlePreview} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: textPrimary, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
          Preview
        </button>
        <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#2d2d3a", color: textPrimary, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: accent, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
          {saving ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* Template Picker */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${border}`, background: "#0e0e16" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {categoryTemplates.map((t) => (
            <button key={t.name} onClick={() => loadTemplate(t.name)} style={{
              background: category === t.name ? accent : card, border: `1px solid ${category === t.name ? accent : border}`,
              borderRadius: 6, padding: "8px 14px", cursor: "pointer", color: textPrimary, fontFamily: "inherit",
              whiteSpace: "nowrap", fontSize: 12, flexShrink: 0,
            }}>
              <span style={{ marginRight: 4 }}>{t.emoji}</span>{t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4, padding: "4px 20px", minHeight: 480 }}>
        {/* HTML Panel (top-left) */}
        <CodePanel
          label="HTML" icon="<>" value={htmlCode} onChange={setHtmlCode}
          collapsed={collapsed.html} onToggleCollapse={() => toggleCollapse("html")}
          active={!collapsed.html}
        />

        {/* CSS Panel (top-right) */}
        <CodePanel
          label="CSS" icon="#" value={cssCode} onChange={setCssCode}
          collapsed={collapsed.css} onToggleCollapse={() => toggleCollapse("css")}
          active={!collapsed.css}
        />

        {/* JS Panel (bottom-left) */}
        <CodePanel
          label="JS" icon="{ }" value={jsCode} onChange={setJsCode}
          collapsed={collapsed.js} onToggleCollapse={() => toggleCollapse("js")}
          active={!collapsed.js}
          actions={
            <select value={jsLanguage} onChange={(e) => setJsLanguage(e.target.value)} style={{ ...inputStyle, padding: "2px 6px", fontSize: 11, width: "auto", background: "#0d0d15" }}>
              {JS_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          }
        />

        {/* Compute Panel (bottom-right) */}
        <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${showCompute ? accent : border}`, borderRadius: 8, overflow: "hidden", minHeight: 200, background: "#1a1a24" }}>
          {/* Compute Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px",
            background: showCompute ? "#111118" : "#0d0d15", borderBottom: `1px solid ${border}`, flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: showCompute ? textPrimary : textSecondary }}>
              <span>&#9881;</span><span>Compute</span>
              <span style={{ fontSize: 10, color: textSecondary, fontWeight: 400 }}>(optional)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select value={computeLanguage} onChange={(e) => setComputeLanguage(e.target.value)} style={{ ...inputStyle, padding: "2px 6px", fontSize: 11, width: "auto", background: "#0d0d15" }}>
                {COMPUTE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={handleRunCompute} disabled={executing || !computeCode.trim()} style={{
                padding: "2px 10px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: executing ? "#444" : "#2ea043", color: "#fff",
              }}>
                {executing ? "Running..." : "Run"}
              </button>
              <button onClick={() => setShowCompute((p) => !p)} style={{ background: "none", border: "none", color: textSecondary, cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>
                {showCompute ? "\u25BC" : "\u25B6"}
              </button>
            </div>
          </div>

          {/* Compute Body */}
          {showCompute && (
            <>
              <textarea
                value={computeCode} onChange={(e) => setComputeCode(e.target.value)} spellCheck={false}
                placeholder="Python or SQL code for server-side execution..."
                style={{
                  flex: 1, width: "100%", padding: "10px 12px", background: "#1a1a24", color: textPrimary,
                  border: "none", outline: "none", resize: "none", fontFamily: "'Fira Code', Consolas, monospace",
                  fontSize: 13, lineHeight: 1.6, boxSizing: "border-box", minHeight: 100,
                }}
              />
              {computeOutput && (
                <pre style={{ margin: 0, padding: "8px 12px", background: "#0d0d15", borderTop: `1px solid ${border}`, color: "#a5d6a7", fontSize: 12, fontFamily: "monospace", maxHeight: 100, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                  {computeOutput}
                </pre>
              )}
            </>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div style={{ padding: "4px 20px 24px" }}>
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", fontSize: 13, color: textSecondary, borderBottom: `1px solid ${border}`, background: "#111118" }}>
            Preview
          </div>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-forms"
              style={{ width: "100%", height: 350, border: "none", background: "#fff" }}
              title="Widget Preview"
            />
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: textSecondary, fontSize: 14 }}>
              Click &quot;Preview&quot; to see your widget in action
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
