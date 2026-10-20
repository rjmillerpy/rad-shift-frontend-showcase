"use client";
import React, { useCallback, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { API_URL } from "@/lib/config";
import Modal from "@/components/Modal";
import type { WidgetInfo } from "@/types/post";
import { WIDGET_THEME } from "../theme";

interface Review { id: number; username: string; rating: number; text: string; created_at: string; }

const { bg, card, border, accent, textPrimary, textSecondary } = WIDGET_THEME;

export default function WidgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [widget, setWidget] = useState<WidgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get(`/widgets/${id}`);
        const w = res.data.widget ?? res.data;
        setWidget(w);
        setInstalled(!!res.data.installed);
        setLiked(!!res.data.liked);
        setSaved(!!res.data.saved);
        setMyRating(res.data.my_rating ?? 0);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
    api.get(`/widgets/${id}/reviews`)
      .then((r) => setReviews(r.data.reviews ?? r.data ?? []))
      .catch((e) => { console.error("Failed to fetch reviews:", e); });
  }, [id]);

  const toggleInstall = async () => {
    if (!widget) return;
    try {
      if (installed) { await api.delete(`/widgets/${id}/install`); setWidget({ ...widget, install_count: Math.max(0, widget.install_count - 1) }); }
      else { await api.post(`/widgets/${id}/install`); setWidget({ ...widget, install_count: widget.install_count + 1 }); }
      setInstalled(!installed);
    } catch (e) { console.error(e); }
  };

  const toggleLike = async () => {
    if (!widget) return;
    try {
      if (liked) { await api.delete(`/widgets/${id}/like`); setWidget({ ...widget, likes: Math.max(0, widget.likes - 1) }); }
      else { await api.post(`/widgets/${id}/like`); setWidget({ ...widget, likes: widget.likes + 1 }); }
      setLiked(!liked);
    } catch (e) { console.error(e); }
  };

  const toggleSave = async () => {
    try {
      if (saved) await api.delete(`/widgets/${id}/save`);
      else await api.post(`/widgets/${id}/save`);
      setSaved(!saved);
    } catch (e) { console.error(e); }
  };

  const submitRating = async (stars: number) => {
    setMyRating(stars);
    try { await api.post(`/widgets/${id}/rate`, { rating: stars }); } catch (e) { console.error(e); }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return;
    try {
      const res = await api.post(`/widgets/${id}/reviews`, { text: reviewText.trim(), rating: myRating || undefined });
      const newReview = res.data.review ?? res.data;
      setReviews((prev) => [newReview, ...prev]);
      setReviewText("");
    } catch (e) { console.error(e); }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    try { await api.post(`/widgets/${id}/report`, { reason: reportReason.trim() }); setReportOpen(false); setReportReason(""); alert("Report submitted"); } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ minHeight: "100vh", background: bg, color: textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  if (!widget) return <div style={{ minHeight: "100vh", background: bg, color: textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}>Widget not found</div>;

  const iframeW = expanded ? Math.min(900, window.innerWidth - 80) : widget.default_width;
  const iframeH = expanded ? 600 : widget.default_height;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 40px" }}>
        <Link href="/widgets" style={{ color: textSecondary, textDecoration: "none", fontSize: 13, marginBottom: 16, display: "inline-block" }}>Back to Store</Link>

        {/* Title area */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{widget.icon_emoji || "\u{1F9E9}"}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{widget.title}</h1>
            <div style={{ fontSize: 13, color: textSecondary }}>by <Link href={`/profile/${widget.author_username}`} style={{ color: accent, textDecoration: "none" }}>{widget.author_username}</Link></div>
          </div>
        </div>
        <p style={{ color: textSecondary, fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{widget.description || "No description provided."}</p>

        {/* Widget iframe */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button onClick={() => setExpanded(!expanded)} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 6, color: textSecondary, cursor: "pointer", padding: "4px 12px", fontSize: 12, fontFamily: "inherit" }}>
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
          <iframe
            src={`${API_URL}/widgets/${id}/render`}
            sandbox="allow-scripts allow-forms"
            style={{ width: iframeW, height: iframeH, border: `1px solid ${border}`, borderRadius: 8, background: "#fff", display: "block", margin: "0 auto", transition: "all 0.2s" }}
            title={widget.title}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button onClick={toggleInstall} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: installed ? "#2d2d3a" : accent, color: installed ? textSecondary : "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
            {installed ? "Uninstall" : "Install"} ({widget.install_count})
          </button>
          <button onClick={toggleLike} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: liked ? "#2d1a3a" : "transparent", color: liked ? "#e056a0" : textPrimary, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            {liked ? "Liked" : "Like"} ({widget.likes})
          </button>
          <button onClick={toggleSave} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: saved ? "#1a2d3a" : "transparent", color: saved ? "#56b0e0" : textPrimary, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            {saved ? "Saved" : "Save"}
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href).catch((e) => { console.error("Copy failed:", e); }); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: textPrimary, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            Share
          </button>
          <button onClick={() => setReportOpen(true)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid #3a1a1a`, background: "transparent", color: "#c0392b", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            Report
          </button>
        </div>

        {/* Rating */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Rate this widget</h3>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => submitRating(s)} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: (hoverStar || myRating) >= s ? "#f1c40f" : "#333", transition: "color 0.1s" }}>
                &#9733;
              </button>
            ))}
            {widget.rating_avg != null && <span style={{ fontSize: 13, color: textSecondary, marginLeft: 12, alignSelf: "center" }}>Avg: {widget.rating_avg.toFixed(1)}/5</span>}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Reviews</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a review..." style={{ flex: 1, padding: "8px 12px", background: "#1a1a24", border: `1px solid ${border}`, borderRadius: 6, color: textPrimary, fontSize: 13, fontFamily: "inherit" }} />
            <button onClick={submitReview} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: accent, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Post</button>
          </div>
          {reviews.length === 0 ? (
            <p style={{ color: textSecondary, fontSize: 13 }}>No reviews yet. Be the first!</p>
          ) : reviews.map((r) => (
            <div key={r.id} style={{ borderBottom: `1px solid ${border}`, padding: "10px 0", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{r.username}</span>
                <span style={{ color: "#f1c40f" }}>{"*".repeat(r.rating)}</span>
              </div>
              <p style={{ margin: "4px 0 0", color: textSecondary }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <Modal
          label="Report widget"
          onClose={closeReport}
          backdropColor="rgba(0,0,0,0.6)"
          panelStyle={{ background: card, borderRadius: 12, padding: 20, minWidth: 300, maxWidth: 400, border: `1px solid ${border}` }}
        >
            <h4 style={{ marginTop: 0, color: "#c0392b" }}>Report Widget</h4>
            <textarea aria-label="What is wrong with this widget?" value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={4} placeholder="Describe the issue..." style={{ width: "100%", padding: 8, background: "#1a1a24", border: `1px solid ${border}`, borderRadius: 6, color: textPrimary, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            <button onClick={submitReport} style={{ marginTop: 8, width: "100%", padding: 10, background: "#c0392b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
              Submit Report
            </button>
        </Modal>
      )}
    </div>
  );
}
