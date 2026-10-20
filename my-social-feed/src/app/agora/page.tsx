"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import FloatingButtons from "@/components/FloatingButtons";
import api from "@/lib/api";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { normalizePosts } from "@/lib/postUtils";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";

import {
  AGORA_TABS,
  type AgoraTabKey,
  LIST_ROW_PREVIEW_CHARS,
  POSTS_PER_PAGE,
} from "./constants";


function truncate(text: string, cap: number): string {
  return text.length > cap ? text.slice(0, cap) + "…" : text;
}

export default function AgoraPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<AgoraTabKey>("algo");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (feedTab: AgoraTabKey, pg: number) => {
    setLoading(true);
    try {
      const endpoint = feedTab === "following" ? "/posts/following" : "/posts/algo";
      const res = await api.get(endpoint, {
        params: { offset: pg * POSTS_PER_PAGE, limit: POSTS_PER_PAGE },
      });
      const fetched = normalizePosts(res.data.posts);
      // Replace on every page change — the UI here is a paginator, not
      // infinite scroll. Appending would duplicate React keys when the
      // user goes Next then Prev.
      setPosts(fetched);
      setHasMore(res.data.has_more ?? false);
      setPage(pg);
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts(tab, 0);
  }, [tab, token, fetchPosts]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#e8e0d0",
      fontFamily: "'Verdana', 'Geneva', 'Tahoma', sans-serif",
      fontSize: "13px",
    }}>
      <FloatingButtons feedSettingsPath="/settings/agora" />

      {/* Forum header */}
      <div style={{
        background: "linear-gradient(180deg, #2d5f4a 0%, #1a4035 100%)",
        color: "#fff",
        padding: "12px 20px",
        borderBottom: "3px solid #8faa70",
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "bold", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            Agora
          </h1>
          <div style={{ fontSize: "11px", color: "#a8c8b8" }}>
            {token ? <Link href="/profile" style={{ color: "#a8c8b8", textDecoration: "none" }}>My Profile</Link> : <Link href="/login" style={{ color: "#a8c8b8", textDecoration: "none" }}>Log In / Register</Link>}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{
        background: "#d0c8b8",
        padding: "6px 20px",
        fontSize: "11px",
        borderBottom: "1px solid #b0a890",
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Home</Link>
          {" > "}
          <span style={{ color: "#333", fontWeight: "bold" }}>Agora Forum</span>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "12px 20px" }}>

        {/* Tab bar — looks like forum category tabs */}
        <div style={{
          display: "flex",
          background: "#2d5f4a",
          borderRadius: "4px 4px 0 0",
          overflow: "hidden",
        }}>
          {AGORA_TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => { setTab(t.key); setPage(0); }}
              style={{
                padding: "8px 20px",
                background: tab === t.key ? "#fff" : "transparent",
                color: tab === t.key ? "#2d5f4a" : "#b0d0c0",
                border: "none",
                borderRight: "1px solid #1a4035",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: tab === t.key ? "bold" : "normal",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Thread list header */}
        <table data-testid="forum-table" style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #a09880",
          background: "#fff",
        }}>
          <thead>
            <tr style={{ background: "#d0c8b8", fontSize: "11px", fontWeight: "bold", color: "#333" }}>
              <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: "2px solid #a09880", width: "5%" }}>#</th>
              <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: "2px solid #a09880", width: "55%" }}>Post</th>
              <th style={{ padding: "6px 10px", textAlign: "center", borderBottom: "2px solid #a09880", width: "15%" }}>Author</th>
              <th style={{ padding: "6px 10px", textAlign: "center", borderBottom: "2px solid #a09880", width: "10%" }}>Stats</th>
              <th style={{ padding: "6px 10px", textAlign: "right", borderBottom: "2px solid #a09880", width: "15%" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && posts.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#888" }}>Loading posts...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#888" }}>No posts yet. Be the first!</td></tr>
            ) : (
              posts.map((post, i) => {
                const postNum = page * POSTS_PER_PAGE + i + 1;
                // Compute the timestamp Date once per row (rule 22).
                const postedAt = new Date(post.unix_timestamp * 1000);
                return (
                  <tr
                    key={post.id}
                    data-testid={`post-row-${post.id}`}
                    style={{
                      background: i % 2 === 0 ? "#f8f6f0" : "#fff",
                      borderBottom: "1px solid #e0d8c8",
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/agora/${post.id}`)}
                  >
                    {/* Number */}
                    <td style={{ padding: "8px 10px", color: "#888", fontSize: "11px", verticalAlign: "top" }}>
                      {postNum}
                    </td>

                    {/* Post text */}
                    <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: "bold", color: "#2d5f4a", fontSize: "13px", marginBottom: "2px" }}>
                        {truncate(post.text, LIST_ROW_PREVIEW_CHARS)}
                      </div>
                      {post.image_url && <span style={{ fontSize: "10px", color: "#888" }}>[img]</span>}
                      {post.video_url && <span style={{ fontSize: "10px", color: "#888" }}>[video]</span>}
                      {post.audio_url && <span style={{ fontSize: "10px", color: "#888" }}>[audio]</span>}
                      {(post.replies_count ?? 0) > 0 && (
                        <span style={{ fontSize: "10px", color: "#666", marginLeft: "8px" }}>
                          💬 {post.replies_count} {post.replies_count === 1 ? "reply" : "replies"}
                        </span>
                      )}
                    </td>

                    {/* Author */}
                    <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "top" }}>
                      <img
                        src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)}
                        alt=""
                        style={{ width: "28px", height: "28px", objectFit: "cover", borderRadius: "2px", display: "block", margin: "0 auto 2px" }}
                      />
                      <Link href={`/profile/${post.username}`} style={{ color: "#2d5f4a", textDecoration: "none", fontSize: "11px", fontWeight: "bold" }}>
                        {post.username}
                      </Link>
                    </td>

                    {/* Stats */}
                    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: "10px", color: "#666", verticalAlign: "top" }}>
                      <div>❤️ {post.likes}</div>
                      <div>😂 {post.laughs ?? 0}</div>
                      <div>🔁 {post.reposts}</div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: "10px", color: "#888", verticalAlign: "top" }}>
                      {postedAt.toLocaleDateString()}
                      <br />
                      <span style={{ fontSize: "9px" }}>{postedAt.toLocaleTimeString()}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px",
          background: "#d0c8b8",
          borderRadius: "0 0 4px 4px",
          border: "1px solid #a09880",
          borderTop: "none",
          fontSize: "11px",
        }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button
              data-testid="prev-page"
              onClick={() => fetchPosts(tab, Math.max(0, page - 1))}
              disabled={page === 0}
              style={{
                padding: "3px 10px", border: "1px solid #a09880", borderRadius: "2px",
                background: page === 0 ? "#e0d8c8" : "#fff", cursor: page === 0 ? "default" : "pointer",
                fontSize: "11px", fontFamily: "inherit", color: page === 0 ? "#aaa" : "#333",
              }}
            >
              « Prev
            </button>
            <span style={{ padding: "3px 8px", color: "#333" }}>Page {page + 1}</span>
            <button
              data-testid="next-page"
              onClick={() => fetchPosts(tab, page + 1)}
              disabled={!hasMore}
              style={{
                padding: "3px 10px", border: "1px solid #a09880", borderRadius: "2px",
                background: !hasMore ? "#e0d8c8" : "#fff", cursor: !hasMore ? "default" : "pointer",
                fontSize: "11px", fontFamily: "inherit", color: !hasMore ? "#aaa" : "#333",
              }}
            >
              Next »
            </button>
          </div>
          <span style={{ color: "#555" }}>
            Showing {posts.length > 0 ? page * POSTS_PER_PAGE + 1 : 0}-{page * POSTS_PER_PAGE + posts.length} posts
          </span>
        </div>

        {/* Forum footer */}
        <div style={{ textAlign: "center", padding: "16px", fontSize: "10px", color: "#999" }}>
          Powered by RadShift Agora
        </div>
      </div>
    </div>
  );
}
