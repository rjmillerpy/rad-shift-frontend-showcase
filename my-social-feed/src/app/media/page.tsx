"use client";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import PostCard from "@/components/PostCard";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import { useReplies } from "@/hooks/useReplies";
import type { Post } from "@/types/post";

type MediaTab = "all" | "audio" | "video";

const TABS: { key: MediaTab; label: string }[] = [
  { key: "all", label: "All Media" },
  { key: "audio", label: "Audio" },
  { key: "video", label: "Video" },
];

const PAGE_SIZE = 20;

export default function MediaPage() {
  const [tab, setTab] = useState<MediaTab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  const actions = usePostInteractions(setPosts);
  const { replyProps } = useReplies();

  const fetchPosts = useCallback(async (mediaType: MediaTab, pageOffset: number) => {
    setLoading(true);
    try {
      const res = await api.get("/posts/media", {
        params: { media_type: mediaType, offset: pageOffset, limit: PAGE_SIZE },
      });
      const fetched: Post[] = res.data.posts ?? [];
      setPosts(pageOffset === 0 ? fetched : (prev) => [...prev, ...fetched]);
      setHasMore(res.data.has_more ?? false);
    } catch (err) {
      console.error("Failed to load media posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    void fetchPosts(tab, 0);
  }, [tab, fetchPosts]);

  const loadMore = useCallback(() => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    void fetchPosts(tab, nextOffset);
  }, [offset, tab, fetchPosts]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 12px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Media</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 20px",
              borderRadius: 20,
              border: "none",
              background: tab === key ? "#6c5ce7" : "#f0f0f0",
              color: tab === key ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: tab === key ? 600 : 400,
              transition: "background 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: 40 }}>Loading media...</p>
      ) : posts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: 40 }}>No media posts found.</p>
      ) : (
        posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} {...actions} {...replyProps} />
        ))
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div style={{ textAlign: "center", padding: 16 }}>
          <button
            onClick={loadMore}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Load More
          </button>
        </div>
      )}

      {loading && posts.length > 0 && (
        <p style={{ textAlign: "center", color: "#888", padding: 16 }}>Loading...</p>
      )}
    </div>
  );
}
