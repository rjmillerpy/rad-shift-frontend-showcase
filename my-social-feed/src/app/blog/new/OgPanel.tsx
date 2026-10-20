"use client";
import React, { useId } from "react";
import { OG_TITLE_MAX_CHARS, OG_DESCRIPTION_MAX_CHARS } from "./constants";

type Props = {
  open: boolean;
  onToggle: () => void;
  title: string;
  seoDescription: string;
  featuredImage: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  onOgTitleChange: (v: string) => void;
  onOgDescriptionChange: (v: string) => void;
  onOgImageChange: (v: string) => void;
};

// Host to display in preview cards. Falls back to a placeholder during SSR.
function currentHost(): string {
  return typeof window !== "undefined" ? window.location.host : "localhost";
}

export default function OgPanel({
  open, onToggle, title, seoDescription, featuredImage,
  ogTitle, ogDescription, ogImage,
  onOgTitleChange, onOgDescriptionChange, onOgImageChange,
}: Props) {
  const fieldId = useId(); // ties each <label> to its control (htmlFor/id)
  const effectiveTitle = ogTitle || title || "Title";
  const effectiveDescription = ogDescription || seoDescription || "Description";
  const effectiveImage = ogImage || featuredImage;
  const host = currentHost();

  return (
    <div style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
      <button
        data-testid="toggle-og"
        onClick={onToggle}
        style={{ width: "100%", padding: "10px 16px", background: "#f0f0f0", border: "none", textAlign: "left", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
      >
        {open ? "▼" : "▶"} Open Graph (Social Sharing Preview)
      </button>
      {open && (
        <div data-testid="og-panel" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
            These fields control how your post appears when shared on Twitter, Facebook, LinkedIn, etc.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor={`${fieldId}-og-title`} style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>OG Title</label>
            <input id={`${fieldId}-og-title`} data-testid="og-title" type="text" value={ogTitle} onChange={(e) => onOgTitleChange(e.target.value)}
              placeholder={title || "Falls back to post title"}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }} />
            <span style={{ fontSize: 11, color: (ogTitle || title).length > OG_TITLE_MAX_CHARS ? "#c00" : "#888" }}>
              {(ogTitle || title).length}/{OG_TITLE_MAX_CHARS}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor={`${fieldId}-og-description`} style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>OG Description</label>
            <textarea id={`${fieldId}-og-description`} data-testid="og-description" value={ogDescription} onChange={(e) => onOgDescriptionChange(e.target.value)}
              placeholder={seoDescription || "Falls back to SEO description"}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, minHeight: 50 }} />
            <span style={{ fontSize: 11, color: ogDescription.length > OG_DESCRIPTION_MAX_CHARS ? "#c00" : "#888" }}>
              {ogDescription.length}/{OG_DESCRIPTION_MAX_CHARS}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor={`${fieldId}-og-image-url`} style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>OG Image URL</label>
            <input id={`${fieldId}-og-image-url`} data-testid="og-image" type="text" value={ogImage} onChange={(e) => onOgImageChange(e.target.value)}
              placeholder={featuredImage || "Falls back to featured image"}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }} />
            <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0 0" }}>Recommended: 1200x630px for best display</p>
          </div>

          <h4 style={{ fontSize: 13, margin: "16px 0 8px 0" }}>Preview</h4>

          {/* Twitter Card Preview */}
          <div data-testid="og-twitter-preview" style={{ border: "1px solid #e1e8ed", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            {effectiveImage && (
              <img src={effectiveImage} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
            )}
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: "bold", lineHeight: 1.3, marginBottom: 2 }}>{effectiveTitle}</div>
              <div style={{ fontSize: 13, color: "#536471", lineHeight: 1.3 }}>{effectiveDescription}</div>
              <div style={{ fontSize: 12, color: "#536471", marginTop: 4 }}>🔗 {host}</div>
            </div>
          </div>

          {/* Facebook Preview */}
          <div data-testid="og-facebook-preview" style={{ border: "1px solid #ddd", overflow: "hidden" }}>
            {effectiveImage && (
              <img src={effectiveImage} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
            )}
            <div style={{ padding: "8px 12px", background: "#f2f3f5" }}>
              <div style={{ fontSize: 11, color: "#606770", textTransform: "uppercase" }}>{host}</div>
              <div style={{ fontSize: 15, fontWeight: "bold", lineHeight: 1.2, marginTop: 2 }}>{effectiveTitle}</div>
              <div style={{ fontSize: 13, color: "#606770", marginTop: 2 }}>{effectiveDescription}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
