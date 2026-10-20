"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { API_URL } from "@/lib/config";
import { WIDGET_THEME } from "../../theme";

/** The origin a sandbox="allow-scripts" iframe (no allow-same-origin) reports. */
const SANDBOX_ORIGIN = "null";

interface NetworkEntry {
  type: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  message?: string;
  ts: number;
}

interface BrowserConfig {
  browser: string;
  os: string;
  user_agent: string;
}

interface TelemetryData {
  log: NetworkEntry[];
  timers: number;
  mutations: number;
  websockets: number;
  service_workers: number;
}

interface AnalysisResult {
  total_requests: number;
  external_domains: string[];
  suspicious_domains: string[];
  websocket_connections: number;
  service_workers: number;
  timer_count: number;
  risk_level: "low" | "medium" | "high";
  risk_reasons: string[];
  warnings: string[];
}

const { bg, card, border, accent, textPrimary, textSecondary } = WIDGET_THEME;

const riskColors: Record<string, string> = {
  low: "#27ae60",
  medium: "#f39c12",
  high: "#c0392b",
};

export default function WidgetSandboxPage() {
  const { id } = useParams<{ id: string }>();
  const [configs, setConfigs] = useState<BrowserConfig[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [networkLog, setNetworkLog] = useState<NetworkEntry[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch sandbox configs
  useEffect(() => {
    api
      .get("/widgets/sandbox/configs")
      .then((r) => setConfigs(r.data.configs ?? []))
      .catch((e) => { console.error("Failed to fetch sandbox configs:", e); });
  }, []);

  // Listen for postMessage telemetry from the quarantined iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Only our iframe may report, or any other window, tab or extension
      // could post fake telemetry into the server's analysis. Sandboxed
      // without allow-same-origin, its origin is always the opaque "null"
      // (no real site can claim that); identity pins it to this iframe.
      if (e.origin !== SANDBOX_ORIGIN || e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === "widget_network" && String(e.data.widget_id) === id) {
        setNetworkLog(e.data.log ?? []);
        setTelemetry({
          log: e.data.log ?? [],
          timers: e.data.timers ?? 0,
          mutations: e.data.mutations ?? 0,
          websockets: e.data.websockets ?? 0,
          service_workers: e.data.service_workers ?? 0,
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [id]);

  // Auto-scroll log panel
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [networkLog]);

  const handleConfigChange = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setNetworkLog([]);
    setTelemetry(null);
    setAnalysis(null);
    setIframeKey((k) => k + 1);
  }, []);

  const runFullScan = useCallback(async () => {
    if (!telemetry) return;
    setScanning(true);
    try {
      const res = await api.post(`/widgets/${id}/sandbox/telemetry`, {
        events: telemetry.log,
      });
      setAnalysis(res.data.analysis ?? null);
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  }, [id, telemetry]);

  const iframeSrc = `${API_URL}/widgets/${id}/sandbox?config_idx=${selectedIdx}`;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 40px" }}>
        <Link href={`/widgets/${id}`} style={{ color: textSecondary, textDecoration: "none", fontSize: 13, marginBottom: 16, display: "inline-block" }}>
          Back to Widget
        </Link>

        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Sandbox Testing</h1>
        <p style={{ color: textSecondary, fontSize: 13, marginBottom: 20 }}>
          Test widget #{id} in a quarantined environment with network monitoring.
        </p>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <label htmlFor="sandbox-config" style={{ fontSize: 13, color: textSecondary }}>Browser / OS:</label>
          <select
            id="sandbox-config"
            value={selectedIdx}
            onChange={(e) => handleConfigChange(Number(e.target.value))}
            style={{ padding: "6px 12px", background: card, border: `1px solid ${border}`, borderRadius: 6, color: textPrimary, fontSize: 13, fontFamily: "inherit" }}
          >
            {configs.map((c, i) => (
              <option key={i} value={i}>
                {c.browser} - {c.os}
              </option>
            ))}
          </select>

          <button
            onClick={runFullScan}
            disabled={scanning || !telemetry}
            style={{
              padding: "6px 18px", borderRadius: 6, border: "none",
              background: scanning || !telemetry ? "#2d2d3a" : accent,
              color: scanning || !telemetry ? textSecondary : "#fff",
              cursor: scanning || !telemetry ? "default" : "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {scanning ? "Scanning..." : "Run Full Scan"}
          </button>

          <button
            onClick={() => handleConfigChange(selectedIdx)}
            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: textPrimary, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
          >
            Reload
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Quarantined iframe */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Quarantined Preview</h3>
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={iframeSrc}
              sandbox="allow-scripts"
              style={{ width: "100%", height: 400, border: `1px solid ${border}`, borderRadius: 8, background: "#fff" }}
              title="Sandbox preview"
            />
            {telemetry && (
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: textSecondary }}>
                <span>Timers: {telemetry.timers}</span>
                <span>Mutations: {telemetry.mutations}</span>
                <span>WS: {telemetry.websockets}</span>
                <span>SW: {telemetry.service_workers}</span>
              </div>
            )}
          </div>

          {/* Network monitor */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>
              Network Monitor{" "}
              <span style={{ color: textSecondary, fontWeight: 400 }}>({networkLog.length} events)</span>
            </h3>
            <div style={{ flex: 1, overflowY: "auto", maxHeight: 400, background: "#0d0d14", borderRadius: 6, padding: 8, fontSize: 12, fontFamily: "monospace" }}>
              {networkLog.length === 0 ? (
                <p style={{ color: textSecondary, margin: 0 }}>Waiting for network activity...</p>
              ) : (
                networkLog.map((entry, i) => {
                  const typeColor =
                    entry.type === "fetch" ? "#3498db"
                    : entry.type === "xhr" ? "#2ecc71"
                    : entry.type === "websocket" ? "#e74c3c"
                    : entry.type === "warning" ? "#f39c12"
                    : entry.type === "kill_switch" ? "#c0392b"
                    : entry.type === "service_worker" ? "#e74c3c"
                    : textSecondary;

                  return (
                    <div key={i} style={{ padding: "3px 0", borderBottom: `1px solid ${border}`, lineHeight: 1.5 }}>
                      <span style={{ color: typeColor, fontWeight: 600 }}>[{entry.type.toUpperCase()}]</span>{" "}
                      {entry.method && <span style={{ color: "#9b59b6" }}>{entry.method} </span>}
                      <span style={{ color: textPrimary, wordBreak: "break-all" }}>
                        {entry.url || entry.message || ""}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Risk assessment */}
        {analysis && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginTop: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
              Risk Assessment:{" "}
              <span style={{ color: riskColors[analysis.risk_level] || textSecondary, textTransform: "uppercase" }}>
                {analysis.risk_level}
              </span>
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
              <Stat label="Total Requests" value={analysis.total_requests} />
              <Stat label="External Domains" value={analysis.external_domains.length} />
              <Stat label="Suspicious Domains" value={analysis.suspicious_domains.length} warn={analysis.suspicious_domains.length > 0} />
              <Stat label="WebSocket Conns" value={analysis.websocket_connections} />
              <Stat label="Service Workers" value={analysis.service_workers} warn={analysis.service_workers > 0} />
              <Stat label="Timer Calls" value={analysis.timer_count} />
            </div>

            {analysis.risk_reasons.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, margin: "0 0 6px", color: riskColors[analysis.risk_level] }}>Issues Found</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: textSecondary }}>
                  {analysis.risk_reasons.map((r, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.external_domains.length > 0 && (
              <div>
                <h4 style={{ fontSize: 13, margin: "0 0 6px" }}>External Domains</h4>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {analysis.external_domains.map((d) => (
                    <span
                      key={d}
                      style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 12, fontFamily: "monospace",
                        background: analysis.suspicious_domains.includes(d) ? "#3a1a1a" : "#1a1a24",
                        color: analysis.suspicious_domains.includes(d) ? "#c0392b" : textSecondary,
                        border: `1px solid ${analysis.suspicious_domains.includes(d) ? "#5a2a2a" : border}`,
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div style={{ background: "#0d0d14", borderRadius: 6, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: textSecondary, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: warn ? "#c0392b" : textPrimary }}>{value}</div>
    </div>
  );
}
