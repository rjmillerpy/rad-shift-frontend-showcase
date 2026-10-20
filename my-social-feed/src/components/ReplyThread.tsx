"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PostActions from "@/components/PostActions";
import { postActionState } from "@/components/postActionState";
import api from "@/lib/api";
import type { Post } from "@/types/post";

type ReplyThreadProps = {
  parentId: number;
  token: string | null;
  openReplies: Record<number, boolean>;
  repliesByPost: Record<number, Post[]>;
  onToggleReplies: (postId: number) => void;
  onFetchReplies: (postId: number) => Promise<void>;
  onToggleLike: (postId: number) => void | Promise<void>;
  onRepost: (postId: number) => void | Promise<void>;
  onShare: (postId: number) => void | Promise<void>;
  onToggleSave: (postId: number) => Promise<boolean> | boolean;
  onToggleLaugh: (postId: number) => void | Promise<void>;
  onMarkSlop: (postId: number, reason: string) => Promise<void> | void;
  onReport: (postId: number, reason: string) => Promise<void> | void;
  onQuote: (postId: number) => void;
  depth?: number;
};

export default function ReplyThread(props: ReplyThreadProps) {
  const {
    parentId,
    token,
    openReplies,
    repliesByPost,
    onToggleReplies,
    onFetchReplies,
    onToggleLike,
    onRepost,
    onShare,
    onToggleSave,
    onToggleLaugh,
    onMarkSlop,
    onReport,
    onQuote,
    depth = 0,
  } = props;
  const router = useRouter();
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [openActionTray, setOpenActionTray] = useState<Record<number, boolean>>({});

  if (!openReplies[parentId]) return null;

  const replies = repliesByPost[parentId] || [];

  const handleSendReply = async (replyToId: number) => {
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) {
      router.push("/login");
      return;
    }

    const text = (replyText[replyToId] || "").trim();
    if (!text) return;

    const formData = new FormData();
    formData.append("text", text);
    formData.append("post_metadata", "{}");
    formData.append("is_draft", "false");
    formData.append("is_reply", "true");
    formData.append("parent_post_id", String(replyToId));

    try {
      await api.post("/posts/add", formData);
      setReplyText((prev) => ({ ...prev, [replyToId]: "" }));
      await onFetchReplies(replyToId);
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const toggleActionTray = (postId: number) => {
    setOpenActionTray((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div
      style={{
        marginTop: depth === 0 ? 8 : 4,
        marginLeft: depth === 0 ? 5 : 16,
        paddingLeft: 8,
        borderLeft: depth === 0 ? "2px solid #eee" : "1px solid #f0f0f0",
        fontSize: "12px",
      }}
    >
      <div style={{ marginBottom: 6 }}>
        {replies.length ? (
          replies.map((reply) => (
            <div
              key={reply.id}
              style={{
                marginBottom: 6,
                paddingBottom: 4,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <strong>@{reply.username}</strong>{" "}
              <span style={{ whiteSpace: "pre-wrap" }}>{reply.text}</span>

              <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onToggleReplies(reply.id)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "11px",
                  }}
                >
                  {openReplies[reply.id] ? "Hide replies" : "View replies"}
                </button>
              </div>

              {token && openReplies[reply.id] && (
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <input
                    type="text"
                    placeholder="Reply to this reply..."
                    value={replyText[reply.id] || ""}
                    onChange={(e) =>
                      setReplyText((prev) => ({
                        ...prev,
                        [reply.id]: e.target.value,
                      }))
                    }
                    style={{
                      flex: 1,
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: 4,
                      border: "1px solid #ccc",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendReply(reply.id)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      borderRadius: 4,
                      border: "1px solid #007bff",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Reply
                  </button>
                </div>
              )}

              <ReplyThread {...props} parentId={reply.id} depth={depth + 1} />

              <button
                type="button"
                onClick={() => toggleActionTray(reply.id)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  fontSize: "11px",
                  color: "#007bff",
                  marginTop: "2px",
                }}
              >
                {openActionTray[reply.id] ? "Hide interactions" : "Show interactions"}
              </button>

              {openActionTray[reply.id] && (
                <PostActions
                  {...postActionState(reply)}
                  index={reply.id}
                  metadataExpanded={false}
                  onToggleMetadata={() => {}}
                  onToggleLike={onToggleLike}
                  onRepost={onRepost}
                  onShare={onShare}
                  onToggleSave={onToggleSave}
                  onToggleLaugh={onToggleLaugh}
                  onMarkSlop={onMarkSlop}
                  onReport={onReport}
                  onQuote={onQuote}
                  onToggleReplies={onToggleReplies}
                  variant="compact"
                  iconSize={28}
                />
              )}
            </div>
          ))
        ) : (
          <div style={{ color: "#666" }}>No replies yet.</div>
        )}
      </div>

      {depth === 0 && token && (
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText[parentId] || ""}
            onChange={(e) =>
              setReplyText((prev) => ({
                ...prev,
                [parentId]: e.target.value,
              }))
            }
            style={{
              flex: 1,
              padding: "4px 8px",
              fontSize: "12px",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
          <button
            type="button"
            onClick={() => handleSendReply(parentId)}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              borderRadius: 4,
              border: "1px solid #007bff",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
}
