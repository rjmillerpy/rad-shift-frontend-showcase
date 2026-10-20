"use client";
import React from "react";
import dynamic from "next/dynamic";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const SeoToolkit = dynamic(() => import("@/components/SeoToolkit"), { ssr: false });

type Props = {
  showPreview: boolean;
  title: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  contentHtml: string;
  plainText: string;
  featuredImage: string;
  tags: string;
  targetKeyword: string;
  onTargetKeywordChange: (v: string) => void;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  monetized: boolean;
  adPlacement: string;
};

function currentHost(): string {
  return typeof window !== "undefined" ? window.location.host : "localhost:3000";
}

const LINK_CARD_PREVIEW_CHARS = 100;

export default function PreviewColumn({
  showPreview, title, seoTitle, seoDescription, slug, contentHtml, plainText,
  featuredImage, tags, targetKeyword, onTargetKeywordChange,
  ogTitle, ogDescription, ogImage, monetized, adPlacement,
}: Props) {
  const showAds = monetized && adPlacement !== "none";

  return (
    <div style={{ width: 380, flexShrink: 0 }}>
      {showPreview && (
        <div data-testid="live-preview" style={{ border: "1px solid #ddd", borderRadius: 6, padding: 16, marginBottom: 16, background: "#fff" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#888" }}>Live Preview</h3>

          {/* Link card preview */}
          <div data-testid="link-card-preview" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            {featuredImage && <img src={featuredImage} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />}
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{currentHost()}/blog/{slug}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, lineHeight: 1.3 }}>{seoTitle || title || "Untitled"}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                {seoDescription || plainText.slice(0, LINK_CARD_PREVIEW_CHARS) || "No description"}
              </div>
            </div>
          </div>

          {/* Content preview with ads */}
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, lineHeight: 1.6, maxHeight: 400, overflow: "auto" }}>
            {showAds && (
              <div style={{ background: "#f0f8ff", padding: 6, marginBottom: 8, textAlign: "center", fontSize: 10, color: "#888", border: "1px solid #d0e8ff", borderRadius: 4 }}>[Header Ad]</div>
            )}
            {/* nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml - DOMPurify-sanitised (sanitizeHtml) */}
            <div dangerouslySetInnerHTML={{ __html: contentHtml ? sanitizeHtml(contentHtml) : "<p style='color:#ccc'>Start writing to see preview...</p>" }} />
            {showAds && (
              <div style={{ background: "#f0f8ff", padding: 6, marginTop: 8, textAlign: "center", fontSize: 10, color: "#888", border: "1px solid #d0e8ff", borderRadius: 4 }}>[Footer Ad]</div>
            )}
          </div>
        </div>
      )}

      <SeoToolkit
        title={title}
        contentHtml={contentHtml}
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        slug={slug}
        tags={tags}
        targetKeyword={targetKeyword}
        onTargetKeywordChange={onTargetKeywordChange}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        ogImage={ogImage}
        featuredImage={featuredImage}
      />
    </div>
  );
}
