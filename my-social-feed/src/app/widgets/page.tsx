"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { WidgetInfo } from "@/types/post";
import { WIDGET_THEME } from "./theme";

const CATEGORIES = [
  "All", "Games", "Tools", "API Connectors", "Display Modifiers",
  "Lambda", "Visualization", "Social",
] as const;

const PAGE_SIZE = 18;

const { bg, card, border, accent, textPrimary, textSecondary } = WIDGET_THEME;

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<WidgetInfo[]>([]);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installedIds, setInstalledIds] = useState<Set<number>>(new Set());

  const fetchWidgets = useCallback(async (cat: string, pg: number, append: boolean) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { offset: pg * PAGE_SIZE, limit: PAGE_SIZE };
      if (cat !== "All") params.category = cat;
      const res = await api.get("/widgets", { params });
      const fetched: WidgetInfo[] = res.data.widgets ?? res.data;
      setWidgets(append ? (prev) => [...prev, ...fetched] : fetched);
      setHasMore(res.data.has_more ?? fetched.length === PAGE_SIZE);
      setPage(pg);
    } catch (e) {
      console.error("Error fetching widgets:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWidgets(category, 0, false);
  }, [category, fetchWidgets]);

  useEffect(() => {
    api.get("/widgets/installed").then((res) => {
      const ids: number[] = res.data.widget_ids ?? res.data.map?.((w: WidgetInfo) => w.id) ?? [];
      setInstalledIds(new Set(ids));
    }).catch((e) => { console.error("Failed to fetch installed widgets:", e); });
  }, []);

  const toggleInstall = async (id: number) => {
    try {
      if (installedIds.has(id)) {
        await api.delete(`/widgets/${id}/install`);
        setInstalledIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, install_count: Math.max(0, w.install_count - 1) } : w));
      } else {
        await api.post(`/widgets/${id}/install`);
        setInstalledIds((prev) => new Set(prev).add(id));
        setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, install_count: w.install_count + 1 } : w));
      }
    } catch (e) {
      console.error("Install toggle failed:", e);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 0", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Widget Store</h1>
          <Link href="/widgets/create" style={{ padding: "8px 18px", background: accent, color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            + Create Widget
          </Link>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(0); }}
              style={{
                padding: "6px 16px", borderRadius: 20, border: `1px solid ${category === cat ? accent : border}`,
                background: category === cat ? accent : "transparent", color: category === cat ? "#fff" : textSecondary,
                cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 40px" }}>
        {loading && widgets.length === 0 ? (
          <p style={{ textAlign: "center", color: textSecondary, padding: 40 }}>Loading widgets...</p>
        ) : widgets.length === 0 ? (
          <p style={{ textAlign: "center", color: textSecondary, padding: 40 }}>No widgets found.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {widgets.map((w) => {
                const installed = installedIds.has(w.id);
                return (
                  <div key={w.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{w.icon_emoji || "\u{1F9E9}"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                        <div style={{ fontSize: 12, color: textSecondary }}>by {w.author_username}</div>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: textSecondary, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {w.description || "No description"}
                    </p>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: textSecondary }}>
                      <span>Downloads {w.install_count}</span>
                      <span>Likes {w.likes}</span>
                      {w.rating_avg != null && <span>Rating {w.rating_avg.toFixed(1)}/5</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      <button
                        onClick={() => toggleInstall(w.id)}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                          background: installed ? "#2d2d3a" : accent, color: installed ? textSecondary : "#fff",
                        }}
                      >
                        {installed ? "Uninstall" : "Install"}
                      </button>
                      <Link href={`/widgets/${w.id}`} style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${border}`, color: textPrimary, textDecoration: "none", fontSize: 13 }}>
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  onClick={() => fetchWidgets(category, page + 1, true)}
                  disabled={loading}
                  style={{
                    padding: "10px 32px", borderRadius: 8, border: `1px solid ${border}`,
                    background: "transparent", color: textPrimary, cursor: loading ? "default" : "pointer",
                    fontSize: 14, fontFamily: "inherit",
                  }}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
