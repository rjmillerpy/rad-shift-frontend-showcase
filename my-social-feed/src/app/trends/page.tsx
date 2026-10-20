"use client";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/lib/config";
import type { TrendsResponse } from "@/types/trends";
import TrendSourceCard from "./TrendSourceCard";

const LOAD_ERROR = "Failed to load trends. Try refresh.";

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrends = useCallback(async (force: boolean) => {
    setError(null);
    if (force) setRefreshing(true);
    try {
      const endpoint = force ? "/trends/refresh" : "/trends/";
      const response = force
        ? await axios.post<TrendsResponse>(`${API_URL}${endpoint}`)
        : await axios.get<TrendsResponse>(`${API_URL}${endpoint}`);
      setData(response.data);
    } catch (err) {
      console.error("Trends load failed:", err);
      setError(LOAD_ERROR);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTrends(false);
  }, [loadTrends]);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Trending Now</h1>
          <p style={subtitleStyle}>
            Top keywords and topics across X, Google, Reddit, and Hacker News.
          </p>
        </div>
        <button
          onClick={() => loadTrends(true)}
          disabled={refreshing}
          style={{ ...refreshBtnStyle, opacity: refreshing ? 0.6 : 1 }}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <p style={errorStyle}>{error}</p>}

      {!data && !error ? (
        <p style={loadingStyle}>Loading trends…</p>
      ) : (
        <div style={gridStyle}>
          {data?.sources.map((bundle) => (
            <TrendSourceCard key={bundle.source} bundle={bundle} />
          ))}
        </div>
      )}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 1400, margin: "0 auto", padding: "32px 20px",
  color: "#e0e0e0", background: "#0a0a10", minHeight: "100vh",
};
const headerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 24, flexWrap: "wrap", gap: 16,
};
const titleStyle: React.CSSProperties = { fontSize: 28, fontWeight: 700, margin: 0 };
const subtitleStyle: React.CSSProperties = { fontSize: 14, color: "#888", margin: "4px 0 0" };
const refreshBtnStyle: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: "#1abc9c", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
};
const errorStyle: React.CSSProperties = {
  color: "#e74c3c", background: "#2a1518", border: "1px solid #4a2025",
  padding: 12, borderRadius: 8, margin: "0 0 16px",
};
const loadingStyle: React.CSSProperties = { textAlign: "center", color: "#666", padding: 40 };
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 16,
};
