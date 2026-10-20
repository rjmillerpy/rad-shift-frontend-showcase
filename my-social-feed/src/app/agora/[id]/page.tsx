"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import FloatingButtons from "@/components/FloatingButtons";
import SlopModal from "@/components/SlopModal";
import api from "@/lib/api";
import { normalizePost, normalizePosts } from "@/lib/postUtils";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";

import {
  BREADCRUMB_PREVIEW_CHARS,
  type ReactionAction,
  THREAD_TITLE_PREVIEW_CHARS,
} from "../constants";
import ForumPost from "./ForumPost";


function truncate(text: string, cap: number): string {
  return text.length > cap ? text.slice(0, cap) + "…" : text;
}

function applyReaction(
  post: Post,
  targetId: number,
  action: ReactionAction,
  data: Record<string, unknown>,
): Post {
  if (post.id !== targetId) return post;
  switch (action) {
    case "like":
      return { ...post, likes: data.likes as number, liked_by_me: data.action === "liked" };
    case "laugh":
      return { ...post, laughs: data.laughs as number, laughed_by_me: data.action === "laughed" };
    case "repost":
      return { ...post, reposts: data.reposts as number, reposted_by_me: data.action === "re-posted" };
    case "save":
      return { ...post, saves: data.saves as number, saved_by_me: data.action === "saved" };
  }
}

export default function AgoraThreadPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [slopModalPostId, setSlopModalPostId] = useState<number | null>(null);

  const fetchThread = useCallback(async (postId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(normalizePost(res.data.post));
      const repliesRes = await api.get(`/posts/${postId}/replies`);
      setReplies(normalizePosts(repliesRes.data.replies));
    } catch (e) {
      console.error("Error fetching thread:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) void fetchThread(String(id));
  }, [id, fetchThread]);

  const handleReact = async (postId: number, action: ReactionAction) => {
    if (!token) return;
    try {
      const res = await api.post(`/posts/${action}/${postId}`);
      setPost((prev) => (prev ? applyReaction(prev, postId, action, res.data) : prev));
      setReplies((prev) => prev.map((r) => applyReaction(r, postId, action, res.data)));
    } catch (e) { console.error(e); }
  };

  const handleReply = async (parentId: number) => {
    const text = (replyTexts[parentId] || "").trim();
    if (!token || !text) return;
    try {
      await api.post("/posts/add", new URLSearchParams({
        text, post_metadata: JSON.stringify({}),
        is_draft: "false", is_reply: "true", parent_post_id: String(parentId),
      }));
      setReplyTexts((prev) => { const n = { ...prev }; delete n[parentId]; return n; });
      setReplyingTo(null);
      void fetchThread(String(id));
    } catch (e) { console.error(e); }
  };

  const submitSlop = async (postId: number, reason: string) => {
    if (!token) return;
    try {
      await api.post(`/posts/slop/${postId}`, { reason });
      if (post && post.id === postId) router.push("/agora");
      else setReplies((prev) => prev.filter((r) => r.id !== postId));
    } catch (e) { console.error(e); }
  };

  const toggleReplyBox = (postId: number) => {
    setReplyingTo((current) => (current === postId ? null : postId));
  };

  const cancelReply = (postId: number) => {
    setReplyingTo(null);
    setReplyTexts((prev) => { const n = { ...prev }; delete n[postId]; return n; });
  };

  const renderForumPost = (p: Post, index: number, isOP: boolean) => (
    <ForumPost
      post={p}
      index={index}
      isOP={isOP}
      canInteract={!!token}
      isReplying={replyingTo === p.id}
      replyText={replyTexts[p.id] || ""}
      onReact={handleReact}
      onToggleReply={toggleReplyBox}
      onReplyTextChange={(postId, text) => setReplyTexts((prev) => ({ ...prev, [postId]: text }))}
      onSubmitReply={handleReply}
      onCancelReply={cancelReply}
      onQuote={(postId) => router.push(`/post/${postId}?quote=1`)}
      onSlop={setSlopModalPostId}
    />
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#e8e0d0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Verdana', sans-serif", color: "#888" }}>
      Loading thread...
    </div>
  );

  if (!post) return (
    <div style={{ minHeight: "100vh", background: "#e8e0d0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Verdana', sans-serif", color: "#888" }}>
      Thread not found.
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#e8e0d0", fontFamily: "'Verdana', 'Geneva', sans-serif", fontSize: "13px" }}>
      <FloatingButtons feedSettingsPath="/settings/agora" />

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #2d5f4a 0%, #1a4035 100%)", color: "#fff", padding: "12px 20px", borderBottom: "3px solid #8faa70" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "22px", margin: 0, textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>Agora</h1>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: "#d0c8b8", padding: "6px 20px", fontSize: "11px", borderBottom: "1px solid #b0a890" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Home</Link>
          {" > "}
          <Link href="/agora" style={{ color: "#555", textDecoration: "none" }}>Agora Forum</Link>
          {" > "}
          <span style={{ color: "#333", fontWeight: "bold" }}>
            {truncate(post.text, BREADCRUMB_PREVIEW_CHARS)}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "12px 20px" }}>
        {/* Thread title */}
        <div style={{ background: "#2d5f4a", color: "#fff", padding: "8px 14px", borderRadius: "4px 4px 0 0", fontSize: "14px", fontWeight: "bold" }}>
          {truncate(post.text, THREAD_TITLE_PREVIEW_CHARS)}
        </div>

        {/* Original post */}
        {renderForumPost(post, 0, true)}

        {/* Replies */}
        {replies.length > 0 && (
          <div style={{ marginTop: "2px" }}>
            <div style={{ background: "#d0c8b8", padding: "4px 12px", fontSize: "11px", fontWeight: "bold", color: "#555", border: "1px solid #c0b8a0" }}>
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </div>
            {replies.map((reply, i) => (
              <div key={reply.id}>{renderForumPost(reply, i + 1, reply.username === post.username)}</div>
            ))}
          </div>
        )}

        {/* Back link */}
        <div style={{ textAlign: "center", padding: "16px" }}>
          <Link href="/agora" style={{ color: "#2d5f4a", textDecoration: "none", fontSize: "12px" }}>
            &larr; Back to forum
          </Link>
        </div>
      </div>

      {slopModalPostId !== null && (
        <SlopModal
          postId={slopModalPostId}
          onSubmit={submitSlop}
          onClose={() => setSlopModalPostId(null)}
        />
      )}
    </div>
  );
}
