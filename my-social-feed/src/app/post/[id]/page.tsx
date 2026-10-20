"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReplyThread from "@/components/ReplyThread";
import FloatingButtons from "@/components/FloatingButtons";
import { normalizePost } from "@/lib/postUtils";
import { useAuth } from "@/hooks/useAuth";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import type { Post } from "@/types/post";
import PostBody from "./PostBody";
import QuoteComposer from "./QuoteComposer";
import ReplyComposer from "./ReplyComposer";
import { REPLY_TREE_MAX_DEPTH } from "./constants";

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [openReplies, setOpenReplies] = useState<Record<number, boolean>>({});
  const [repliesByPost, setRepliesByPost] = useState<Record<number, Post[]>>({});
  const [expandedMetadata, setExpandedMetadata] = useState(true);
  const [loading, setLoading] = useState(true);
  const [quoteMode, setQuoteMode] = useState(false);
  const [replyMode, setReplyMode] = useState(false);

  const fetchReplies = useCallback(async (postId: number, depth: number = 0) => {
    try {
      const res = await api.get(`/posts/${postId}/replies`);
      const processedReplies: Post[] = (res.data.replies || []).map((reply: Post) => ({
        ...reply,
        is_me: reply.is_me ?? false,
        saved_by_me: reply.saved_by_me ?? false,
      }));
      setRepliesByPost((prev) => ({ ...prev, [postId]: processedReplies }));
      // Auto-expand every reply we just fetched so nested threads are visible on load.
      setOpenReplies((prev) => {
        const next = { ...prev };
        for (const r of processedReplies) next[r.id] = true;
        return next;
      });
      // Recurse up to REPLY_TREE_MAX_DEPTH so deeply-nested threads still open.
      if (depth < REPLY_TREE_MAX_DEPTH) {
        await Promise.all(processedReplies.map((r) => fetchReplies(r.id, depth + 1)));
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  }, []);

  const fetchPost = useCallback(async (postId: string) => {
    try {
      const res = await api.get(`/posts/${postId}`);
      const p = res.data.post;
      setPost({ ...normalizePost(p), is_me: p.is_me ?? false });
      setOpenReplies({ [Number(postId)]: true });
      await fetchReplies(Number(postId));
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchReplies]);

  useEffect(() => {
    if (id) void fetchPost(String(id));
    if (searchParams.get("quote") === "1") setQuoteMode(true);
    if (searchParams.get("reply") === "1") setReplyMode(true);
  }, [id, searchParams, fetchPost]);

  const handleToggleReplies = async (postId: number) => {
    setOpenReplies((prev) => ({ ...prev, [postId]: !prev[postId] }));
    if (!openReplies[postId]) {
      await fetchReplies(postId);
    }
  };

  // usePostActions expects a setter over Post[]. On the detail page we have a
  // single post, so we adapt: wrap it in an array, apply the update, unwrap.
  const setPosts = useCallback((fn: (prev: Post[]) => Post[]) => {
    setPost((prev) => {
      if (!prev) return prev;
      const [next] = fn([prev]);
      return next || prev;
    });
  }, []);

  // A slopped or reported post can't stay on screen: leave its page. (A reply
  // flagged from the thread below stays until the next load.)
  const leaveIfCurrent = useCallback(
    (postId: number) => { if (post?.id === postId) router.push("/"); },
    [post, router],
  );
  const actions = usePostInteractions(setPosts, { onRemoved: leaveIfCurrent });

  if (loading) {
    return (
      <div style={{ padding: "40px", maxWidth: "800px", margin: "auto", textAlign: "center" }}>
        <p>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: "40px", maxWidth: "800px", margin: "auto", textAlign: "center" }}>
        <p>Post not found.</p>
        <Link href="/" style={{ color: "#007bff" }}>Back to feed</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "auto", position: "relative" }}>
      <FloatingButtons />

      <Link href="/" style={{ color: "#007bff", textDecoration: "none", fontSize: "14px" }}>
        &larr; Back to feed
      </Link>

      <PostBody
        post={post}
        expandedMetadata={expandedMetadata}
        onToggleMetadata={() => setExpandedMetadata((prev) => !prev)}
        {...actions}
        onQuote={() => setQuoteMode(true)}
        onToggleReplies={handleToggleReplies}
      />

      {quoteMode && token && (
        <QuoteComposer post={post} onClose={() => setQuoteMode(false)} />
      )}

      {replyMode && token && (
        <ReplyComposer
          post={post}
          onPosted={() => { setReplyMode(false); void fetchReplies(post.id); }}
          onClose={() => setReplyMode(false)}
        />
      )}

      <div style={{ marginTop: "16px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>
          Replies ({post.replies_count ?? 0})
        </h3>
        <ReplyThread
          parentId={post.id}
          openReplies={openReplies}
          repliesByPost={repliesByPost}
          onToggleReplies={handleToggleReplies}
          onFetchReplies={(pid) => fetchReplies(pid)}
          {...actions}
        />
      </div>
    </div>
  );
}
