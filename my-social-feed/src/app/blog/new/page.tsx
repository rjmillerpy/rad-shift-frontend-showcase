"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import { useAuth } from "@/hooks/useAuth";
import EditorToolbar from "./EditorToolbar";
import OgPanel from "./OgPanel";
import SeoPanel from "./SeoPanel";
import PreviewColumn from "./PreviewColumn";
import { MonetizationPanel, SocialSharingPanel, SchedulerPanel } from "./PublishingPanels";
import { AI_BANNED, WORDS_PER_MINUTE } from "./constants";
import { htmlToPlainText } from "@/components/seoAnalysis";

// axios error shape narrowed to the response.data.detail field the backend uses.
type ApiError = { response?: { data?: { detail?: string } } };
function extractApiErrorDetail(err: unknown): string | null {
  return (err as ApiError)?.response?.data?.detail ?? null;
}

/** Turn a title into a URL slug — same rules as backend so a client-generated
    slug matches what the API produces on save. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export default function BlogEditorPage() {
  const router = useRouter();
  const { token } = useAuth();

  // Content
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [targetKeyword, setTargetKeyword] = useState("");

  // Open Graph
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [showOg, setShowOg] = useState(false);

  // Monetization
  const [monetized, setMonetized] = useState(false);
  const [adPlacement, setAdPlacement] = useState("none");

  // Social sharing
  const [autoShare, setAutoShare] = useState(false);

  // Scheduler
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Auto-slug from title
  useEffect(() => { setSlug(slugify(title)); }, [title]);

  // Derived: word/character stats + AI cliché check
  const plainText = useMemo(() => htmlToPlainText(contentHtml), [contentHtml]);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  const aiClichesFound = useMemo(() => {
    const lower = plainText.toLowerCase();
    return AI_BANNED.filter((p) => lower.includes(p.toLowerCase()));
  }, [plainText]);

  const insertContent = (text: string, wrap: boolean) => {
    setContentHtml((p) => (wrap ? p + `<${text}></${text}>` : p + text));
  };

  const handleSave = async (isDraft: boolean) => {
    if (!token) return;
    if (!title.trim()) { setError("Title is required"); return; }
    if (!contentHtml.trim()) { setError("Content is required"); return; }
    if (!isDraft && aiClichesFound.length > 0) {
      setError(`Cannot publish: ${aiClichesFound.length} AI cliché(s) found. Remove them first: ${aiClichesFound.join(", ")}`);
      return;
    }
    setError("");
    setSaving(true);

    try {
      const res = await api.post("/blog/create", {
        title: title.trim(),
        content_html: contentHtml,
        featured_image_url: featuredImage || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        category: category || null,
        monetized,
        ad_placement: monetized ? adPlacement : "none",
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        og_image: ogImage || featuredImage || null,
        is_draft: isDraft,
      });

      setSaved(true);
      const blogSlug = res.data.blog_post.slug;
      if (!isDraft) router.push(`/blog/${blogSlug}`);
    } catch (e) {
      setError(extractApiErrorDetail(e) || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Share links used by the Social Sharing panel.
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/blog/${slug}`;
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  if (!token) return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <p>Please <a href="/login">log in</a> to create a blog post.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <FloatingButtons hideComposer />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <Link href="/blog" style={{ color: "#007bff", textDecoration: "none", fontSize: 14 }}>&larr; Blog</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Create Blog Post</h1>
          <button data-testid="toggle-preview" onClick={() => setShowPreview(!showPreview)}
            style={{ padding: "6px 14px", background: showPreview ? "#007bff" : "#fff", color: showPreview ? "#fff" : "#333", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>

        {error && (
          <div data-testid="error-msg" style={{ background: "#fee", border: "1px solid #c00", padding: "8px 12px", borderRadius: 4, marginBottom: 16, color: "#c00", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 20 }}>
          {/* Editor column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <input data-testid="blog-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..." style={{ width: "100%", padding: "14px 16px", fontSize: "24px", border: "1px solid #ddd", borderRadius: 6, marginBottom: 12, fontWeight: "bold" }} />

            <input data-testid="featured-image" type="text" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Featured image URL (optional)" style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 4, marginBottom: 12 }} />

            {featuredImage && <img src={featuredImage} alt="Featured" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, marginBottom: 12, objectFit: "cover" }} />}

            <EditorToolbar onInsert={insertContent} />

            <textarea data-testid="blog-content" value={contentHtml} onChange={(e) => setContentHtml(e.target.value)}
              placeholder="Write your blog post content (HTML supported)..."
              style={{ width: "100%", minHeight: "300px", padding: "12px", fontSize: 15, border: "1px solid #ddd", borderRadius: "0 0 6px 6px", fontFamily: "'Georgia', serif", lineHeight: 1.7, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginTop: 4 }}>
              <span>{wordCount} words</span>
              <span>{readingTime} min read</span>
            </div>

            {/* Tags & Category */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, marginTop: 12 }}>
              <input data-testid="blog-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma-separated)" style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, fontSize: 14 }} />
              <input data-testid="blog-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Category" style={{ width: 200, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, fontSize: 14 }} />
            </div>

            <SeoPanel
              open={showSeo}
              onToggle={() => setShowSeo(!showSeo)}
              title={title}
              seoTitle={seoTitle}
              seoDescription={seoDescription}
              slug={slug}
              onSeoTitleChange={setSeoTitle}
              onSeoDescriptionChange={setSeoDescription}
              onSlugChange={setSlug}
            />

            <OgPanel
              open={showOg}
              onToggle={() => setShowOg(!showOg)}
              title={title}
              seoDescription={seoDescription}
              featuredImage={featuredImage}
              ogTitle={ogTitle}
              ogDescription={ogDescription}
              ogImage={ogImage}
              onOgTitleChange={setOgTitle}
              onOgDescriptionChange={setOgDescription}
              onOgImageChange={setOgImage}
            />

            <MonetizationPanel
              monetized={monetized}
              onMonetizedChange={setMonetized}
              adPlacement={adPlacement}
              onAdPlacementChange={setAdPlacement}
            />

            <SocialSharingPanel
              autoShare={autoShare}
              onAutoShareChange={setAutoShare}
              shareLinks={shareLinks}
            />

            <SchedulerPanel
              scheduleEnabled={scheduleEnabled}
              onScheduleEnabledChange={setScheduleEnabled}
              scheduleDate={scheduleDate}
              onScheduleDateChange={setScheduleDate}
              scheduleTime={scheduleTime}
              onScheduleTimeChange={setScheduleTime}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button data-testid="save-draft" onClick={() => handleSave(true)} disabled={saving}
                style={{ padding: "10px 24px", background: "#6c757d", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button data-testid="publish-btn" onClick={() => handleSave(false)} disabled={saving}
                style={{ padding: "10px 24px", background: "#28a745", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
                {saving ? "Publishing..." : scheduleEnabled ? "Schedule" : "Publish"}
              </button>
            </div>
            {saved && <p style={{ color: "#28a745", marginTop: 8, fontSize: 13 }}>Saved!</p>}
          </div>

          <PreviewColumn
            showPreview={showPreview}
            title={title}
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            slug={slug}
            contentHtml={contentHtml}
            plainText={plainText}
            featuredImage={featuredImage}
            tags={tags}
            targetKeyword={targetKeyword}
            onTargetKeywordChange={setTargetKeyword}
            ogTitle={ogTitle}
            ogDescription={ogDescription}
            ogImage={ogImage}
            monetized={monetized}
            adPlacement={adPlacement}
          />
        </div>
      </div>
    </div>
  );
}
