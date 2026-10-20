"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { BLOG_PAGE_SIZE } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

interface BlogPreview {
  id: number;
  slug: string;
  title: string;
  preview: string;
  featured_image_url: string | null;
  tags: string[];
  category: string | null;
  reading_time_minutes: number;
  view_count: number;
  published_at: number | null;
  username: string;
  profile_picture_url: string | null;
  monetized: boolean;
}

export default function BlogListPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [posts, setPosts] = useState<BlogPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    void fetchPosts(0);
  }, []);

  const fetchPosts = async (offset: number) => {
    try {
      const res = await api.get("/blog/list", { params: { offset, limit: BLOG_PAGE_SIZE } });
      if (offset === 0) setPosts(res.data.posts);
      else setPosts((p) => [...p, ...res.data.posts]);
      setHasMore(res.data.has_more);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <FloatingButtons />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Blog</h1>
          {token && (
            <button data-testid="new-blog-btn" onClick={() => router.push("/blog/new")}
              style={{ padding: "8px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
              Write a Post
            </button>
          )}
        </div>

        {loading && <p style={{ color: "#888" }}>Loading...</p>}

        {!loading && posts.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", padding: 40 }}>No blog posts yet. Be the first to write one!</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div data-testid={`blog-card-${post.slug}`} style={{
                border: "1px solid #eee", borderRadius: 8, overflow: "hidden",
                background: "#fff", cursor: "pointer", transition: "box-shadow 0.2s",
              }}>
                {post.featured_image_url && (
                  <img src={post.featured_image_url} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                )}
                <div style={{ padding: 16 }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 18, lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ color: "#666", fontSize: 14, margin: "0 0 12px 0", lineHeight: 1.5 }}>
                    {post.preview}...
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#999" }}>
                    <img src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)} alt=""
                      style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                    <span>{post.username}</span>
                    <span>·</span>
                    <span>{post.reading_time_minutes} min</span>
                    <span>·</span>
                    <span>{post.view_count} views</span>
                    {post.monetized && <span style={{ color: "#28a745" }}>💰</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <button onClick={() => fetchPosts(posts.length)}
              style={{ padding: "8px 20px", background: "#fff", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
