"use client";
import Link from "next/link";

import ImageGallery from "@/components/ImageGallery";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";

import { REACTION_ACTIONS, type ReactionAction } from "../constants";

type ForumPostProps = {
  post: Post;
  /** Position in the thread, 0 for the original post. */
  index: number;
  /** Written by the thread's original poster. */
  isOP: boolean;
  /** A user is logged in: replying and reporting are available. */
  canInteract: boolean;
  /** This post's reply box is open. */
  isReplying: boolean;
  /** Draft text of the reply being written under this post. */
  replyText: string;
  onReact: (postId: number, action: ReactionAction) => void;
  onToggleReply: (postId: number) => void;
  onReplyTextChange: (postId: number, text: string) => void;
  onSubmitReply: (postId: number) => void;
  onCancelReply: (postId: number) => void;
  onQuote: (postId: number) => void;
  onSlop: (postId: number) => void;
};

/** The count and "did I do this" flag for one reaction on a post. */
function reactionState(post: Post, action: ReactionAction): { count: number; active: boolean } {
  switch (action) {
    case "like":
      return { count: post.likes, active: !!post.liked_by_me };
    case "laugh":
      return { count: post.laughs ?? 0, active: !!post.laughed_by_me };
    case "repost":
      return { count: post.reposts, active: !!post.reposted_by_me };
    case "save":
      return { count: post.saves, active: !!post.saved_by_me };
  }
}

/** One post in an Agora thread: author sidebar, body, reactions, reply box. */
export default function ForumPost({
  post: p,
  index,
  isOP,
  canInteract,
  isReplying,
  replyText,
  onReact,
  onToggleReply,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  onQuote,
  onSlop,
}: ForumPostProps) {
  // Compute Date once per rendered post (rule 22).
  const postedAt = new Date(p.unix_timestamp * 1000);
  return (
    <div data-testid={`forum-post-${p.id}`} style={{
      display: "flex",
      border: "1px solid #c0b8a0",
      borderTop: index > 0 ? "none" : "1px solid #c0b8a0",
      background: isOP ? "#f0ece0" : "#fff",
    }}>
      {/* Author sidebar */}
      <div style={{
        width: "150px", padding: "12px", borderRight: "1px solid #c0b8a0",
        textAlign: "center", background: "#e8e0d0", flexShrink: 0,
      }}>
        <img src={proxyIfNeeded(p.profile_picture_url || DEFAULT_AVATAR)} alt=""
          style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "2px", border: "1px solid #ccc", display: "block", margin: "0 auto" }} />
        <div style={{ fontWeight: "bold", fontSize: "12px", color: "#2d5f4a", marginTop: "6px" }}>
          <Link href={`/profile/${p.username}`} style={{ color: "#2d5f4a", textDecoration: "none" }}>{p.username}</Link>
        </div>
        {isOP && <div style={{ fontSize: "9px", background: "#2d5f4a", color: "#fff", borderRadius: "2px", padding: "1px 6px", display: "inline-block", marginTop: "3px" }}>OP</div>}
        <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>
          Joined: {postedAt.toLocaleDateString()}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Post header */}
        <div style={{
          padding: "6px 12px", background: "#d8d0c0", borderBottom: "1px solid #c0b8a0",
          display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666",
        }}>
          <span>#{index + 1} · Posted {postedAt.toLocaleString()}</span>
          <Link href={`/post/${p.id}`} style={{ color: "#888", textDecoration: "none", fontSize: "10px" }}>#permalink</Link>
        </div>

        {/* Post body */}
        <div style={{ padding: "12px", flex: 1 }}>
          <div style={{ fontSize: "13px", lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap", marginBottom: "12px" }}>
            {p.text}
          </div>

          {(p.image_urls && p.image_urls.length > 1) ? (
            <ImageGallery images={p.image_urls} />
          ) : p.image_url ? (
            <img src={p.image_url} alt="" crossOrigin="anonymous" style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "2px", border: "1px solid #ddd", marginBottom: "8px" }} />
          ) : null}
          {p.video_url && <video src={p.video_url} controls playsInline preload="metadata" style={{ maxWidth: "100%", maxHeight: "400px", marginBottom: "8px" }} />}
          {p.audio_url && <audio src={p.audio_url} controls preload="metadata" style={{ width: "100%", marginBottom: "8px" }} />}

          {p.quoted_post && (
            <div style={{ padding: "8px", borderLeft: "3px solid #8faa70", background: "#f8f6f0", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ fontWeight: "bold" }}>Quoting @{p.quoted_post.username}:</span>
              <div style={{ color: "#555", marginTop: "2px" }}>{p.quoted_post.text}</div>
            </div>
          )}
        </div>

        {/* Footer with reactions */}
        <div style={{
          padding: "6px 12px", borderTop: "1px solid #d0c8b8", background: "#f8f6f0",
          display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center",
        }}>
          {REACTION_ACTIONS.map((r) => {
            const { count, active } = reactionState(p, r.action);
            return (
              <button key={r.action} data-testid={`react-${r.action}-${p.id}`}
                onClick={() => onReact(p.id, r.action)}
                style={{
                  padding: "2px 8px", border: active ? "1px solid #2d5f4a" : "1px solid #ccc",
                  borderRadius: "3px", background: active ? "#d8eee0" : "#fff",
                  cursor: "pointer", fontSize: "11px", fontFamily: "'Verdana', sans-serif",
                }}>
                {r.emoji} {count} {active && "✓"}
              </button>
            );
          })}
          <button data-testid={`reply-btn-${p.id}`}
            onClick={() => onToggleReply(p.id)}
            style={{ padding: "2px 8px", border: "1px solid #ccc", borderRadius: "3px", background: isReplying ? "#d8eee0" : "#fff", cursor: "pointer", fontSize: "11px", fontFamily: "'Verdana', sans-serif" }}>
            💬 Reply
          </button>
          <button data-testid={`quote-btn-${p.id}`}
            onClick={() => onQuote(p.id)}
            style={{ padding: "2px 8px", border: "1px solid #ccc", borderRadius: "3px", background: "#fff", cursor: "pointer", fontSize: "11px", fontFamily: "'Verdana', sans-serif" }}>
            📝 Quote
          </button>
          <button data-testid={`slop-btn-${p.id}`}
            onClick={() => canInteract && onSlop(p.id)}
            disabled={!canInteract}
            style={{ padding: "2px 8px", border: "1px solid #ccc", borderRadius: "3px", background: "#fff", cursor: canInteract ? "pointer" : "not-allowed", fontSize: "11px", fontFamily: "'Verdana', sans-serif", marginLeft: "auto", color: "#c00" }}>
            🚩 Slop
          </button>
        </div>

        {/* Reply box */}
        {isReplying && canInteract && (
          <div data-testid={`reply-box-${p.id}`} style={{ padding: "8px 12px", background: "#f0ece0", borderTop: "1px solid #d0c8b8" }}>
            <textarea data-testid={`reply-input-${p.id}`} value={replyText}
              onChange={(e) => onReplyTextChange(p.id, e.target.value)}
              placeholder="Write your reply..." autoFocus
              style={{ width: "100%", minHeight: "80px", padding: "8px", border: "1px solid #ccc", borderRadius: "2px", fontSize: "12px", fontFamily: "'Verdana', sans-serif", resize: "vertical" }} />
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <button data-testid={`reply-submit-${p.id}`}
                onClick={() => onSubmitReply(p.id)}
                style={{ padding: "4px 14px", background: "#2d5f4a", color: "#fff", border: "none", borderRadius: "2px", cursor: "pointer", fontSize: "11px", fontFamily: "'Verdana', sans-serif" }}>
                Post Reply
              </button>
              <button onClick={() => onCancelReply(p.id)}
                style={{ padding: "4px 14px", background: "#999", color: "#fff", border: "none", borderRadius: "2px", cursor: "pointer", fontSize: "11px", fontFamily: "'Verdana', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
