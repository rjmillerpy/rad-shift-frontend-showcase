"use client";
import React, { useId } from "react";
import { SEO_TITLE_MAX_CHARS, SEO_DESCRIPTION_MAX_CHARS } from "./constants";

type Props = {
  open: boolean;
  onToggle: () => void;
  title: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  onSeoTitleChange: (v: string) => void;
  onSeoDescriptionChange: (v: string) => void;
  onSlugChange: (v: string) => void;
};

export default function SeoPanel({
  open, onToggle, title, seoTitle, seoDescription, slug,
  onSeoTitleChange, onSeoDescriptionChange, onSlugChange,
}: Props) {
  const fieldId = useId(); // ties each <label> to its control (htmlFor/id)
  const seoTitleForCounter = seoTitle || title;

  return (
    <div style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
      <button
        data-testid="toggle-seo"
        onClick={onToggle}
        style={{ width: "100%", padding: "10px 16px", background: "#f0f0f0", border: "none", textAlign: "left", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
      >
        {open ? "▼" : "▶"} SEO Settings
      </button>
      {open && (
        <div data-testid="seo-panel" style={{ padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor={`${fieldId}-seo-title`} style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>SEO Title</label>
            <input id={`${fieldId}-seo-title`} data-testid="seo-title" type="text" value={seoTitle}
              onChange={(e) => onSeoTitleChange(e.target.value)}
              placeholder={title || "Auto-generated from title"}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }} />
            <span style={{ fontSize: 11, color: seoTitleForCounter.length > SEO_TITLE_MAX_CHARS ? "#c00" : "#888" }}>
              {seoTitleForCounter.length}/{SEO_TITLE_MAX_CHARS}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor={`${fieldId}-meta-description`} style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>Meta Description</label>
            <textarea id={`${fieldId}-meta-description`} data-testid="seo-description" value={seoDescription}
              onChange={(e) => onSeoDescriptionChange(e.target.value)}
              placeholder="Auto-generated from content..."
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, minHeight: 60 }} />
            <span style={{ fontSize: 11, color: seoDescription.length > SEO_DESCRIPTION_MAX_CHARS ? "#c00" : "#888" }}>
              {seoDescription.length}/{SEO_DESCRIPTION_MAX_CHARS}
            </span>
          </div>
          <div>
            <label htmlFor={`${fieldId}-url-slug`} style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>URL Slug</label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#888" }}>/blog/</span>
              <input id={`${fieldId}-url-slug`} data-testid="seo-slug" type="text" value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
