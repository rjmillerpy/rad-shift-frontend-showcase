"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import { API_URL, DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  content_html: string;
  content_text: string;
  featured_image_url: string | null;
  seo_title: string;
  seo_description: string;
  tags: string[];
  category: string | null;
  monetized: boolean;
  ad_placement: string;
  is_published: boolean;
  published_at: number | null;
  reading_time_minutes: number;
  view_count: number;
  username: string;
  profile_picture_url: string | null;
}

export default function BlogReaderPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [readStart] = useState(Date.now());
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (slug) void fetchPost(String(slug));
  }, [slug]);

  // Inject OG meta tags
  useEffect(() => {
    if (!post) return;
    const ogTags = [
      { property: "og:title", content: post.og_title || post.title },
      { property: "og:description", content: post.og_description || post.seo_description },
      { property: "og:image", content: post.og_image || post.featured_image_url || "" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: window.location.href },
      { name: "twitter:card", content: post.og_image || post.featured_image_url ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: post.og_title || post.title },
      { name: "twitter:description", content: post.og_description || post.seo_description },
      { name: "twitter:image", content: post.og_image || post.featured_image_url || "" },
    ];

    const elements: HTMLMetaElement[] = [];
    ogTags.forEach((tag) => {
      if (!tag.content) return;
      const meta = document.createElement("meta");
      if (tag.property) meta.setAttribute("property", tag.property);
      if (tag.name) meta.setAttribute("name", tag.name);
      meta.setAttribute("content", tag.content);
      document.head.appendChild(meta);
      elements.push(meta);
    });

    // Set page title
    document.title = post.seo_title || post.title;

    return () => { elements.forEach((el) => el.remove()); };
  }, [post]);

  // Track view + read time on unmount
  useEffect(() => {
    return () => {
      if (post && !viewRecorded.current) {
        viewRecorded.current = true;
        const readTime = Math.round((Date.now() - readStart) / 1000);
        // sendBeacon is fire-and-forget and reliable during pagehide; fall
        // back to a regular POST when it isn't available (older Safari).
        const beaconSent = navigator.sendBeacon?.(
          `${API_URL}/blog/${post.id}/view`,
          JSON.stringify({ read_time_seconds: readTime })
        );
        if (!beaconSent) {
          api.post(`/blog/${post.id}/view`, { read_time_seconds: readTime })
            .catch((e) => { console.error("Failed to record blog view:", e); });
        }
      }
    };
  }, [post]);

  const fetchPost = async (s: string) => {
    try {
      const res = await api.get(`/blog/slug/${s}`);
      setPost(res.data.blog_post);
    } catch (e) {
      console.error("Error fetching blog post:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading...</div>;
  if (!post) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Post not found.</div>;

  // Inject inline ads for monetized posts.
  // "minimal" placement means header + footer only, no inline ads — use a
  // sentinel larger than any realistic paragraph count so the modulo check
  // never fires, rather than special-casing the loop.
  const AD_INTERVAL_MINIMAL = 999;
  const AD_INTERVAL_STANDARD = 3;
  const renderContent = () => {
    if (!post.monetized || post.ad_placement === "none") {
      return <div data-testid="blog-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content_html) }} />;
    }

    const paragraphs = post.content_html.split("</p>");
    const adInterval = post.ad_placement === "minimal" ? AD_INTERVAL_MINIMAL : AD_INTERVAL_STANDARD;
    const parts: string[] = [];

    paragraphs.forEach((p, i) => {
      if (!p.trim()) return;
      parts.push(p + "</p>");
      if (i > 0 && i % adInterval === 0 && i < paragraphs.length - 1) {
        parts.push(`<div class="blog-ad" data-testid="inline-ad" style="padding:16px;margin:20px 0;background:#f0f8ff;border:1px solid #d0e8ff;border-radius:6px;text-align:center;color:#888;font-size:13px;">
          [Ad Placement — Revenue goes to @${post.username}]
        </div>`);
      }
    });

    return <div data-testid="blog-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(parts.join("")) }} />;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <FloatingButtons hideComposer />

      {/* Header ad for monetized posts */}
      {post.monetized && post.ad_placement !== "none" && (
        <div data-testid="header-ad" style={{ background: "#f0f8ff", padding: "12px", textAlign: "center", borderBottom: "1px solid #d0e8ff", fontSize: 13, color: "#888" }}>
          [Ad Placement — Revenue goes to @{post.username}]
        </div>
      )}

      {/* Featured image */}
      {post.featured_image_url && (
        <div style={{ maxHeight: 400, overflow: "hidden" }}>
          <img src={post.featured_image_url} alt={post.title}
            style={{ width: "100%", objectFit: "cover", maxHeight: 400 }} />
        </div>
      )}

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 16, fontSize: 13 }}>
          <Link href="/blog" style={{ color: "#007bff", textDecoration: "none" }}>Blog</Link>
          {post.category && <> &gt; <span style={{ color: "#666" }}>{post.category}</span></>}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 36, lineHeight: 1.2, marginBottom: 12, fontFamily: "'Georgia', serif" }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 14, color: "#666" }}>
          <img src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)} alt=""
            style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%" }} />
          <div>
            <Link href={`/profile/${post.username}`} style={{ color: "#333", textDecoration: "none", fontWeight: "bold" }}>
              {post.username}
            </Link>
            <div style={{ fontSize: 12, color: "#999" }}>
              {post.published_at && new Date(post.published_at * 1000).toLocaleDateString()}
              {" · "}
              {post.reading_time_minutes} min read
              {" · "}
              {post.view_count} views
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{ background: "#eef", padding: "2px 10px", borderRadius: 12, fontSize: 12, color: "#555" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: 18,
          lineHeight: 1.8,
          color: "#333",
        }}>
          {renderContent()}
        </div>

        {/* Footer ad */}
        {post.monetized && post.ad_placement !== "none" && (
          <div data-testid="footer-ad" style={{ padding: 16, margin: "32px 0", background: "#f0f8ff", border: "1px solid #d0e8ff", borderRadius: 6, textAlign: "center", color: "#888", fontSize: 13 }}>
            [Ad Placement — Revenue goes to @{post.username}]
          </div>
        )}

        {/* Author card */}
        <div style={{ marginTop: 40, padding: 20, border: "1px solid #eee", borderRadius: 8, display: "flex", gap: 16, alignItems: "center" }}>
          <img src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)} alt=""
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }} />
          <div>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>
              <Link href={`/profile/${post.username}`} style={{ color: "#333", textDecoration: "none" }}>{post.username}</Link>
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              {post.monetized ? "This post earns revenue through ads and subscription pool." : "Free post — no monetization."}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
