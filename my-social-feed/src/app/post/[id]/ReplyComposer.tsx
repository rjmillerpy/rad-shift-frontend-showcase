"use client";
import React, { useState } from "react";
import api from "@/lib/api";
import type { Post } from "@/types/post";
import ComposerBox from "./ComposerBox";

type Props = {
  post: Post;
  onPosted: () => void;
  onClose: () => void;
};

export default function ReplyComposer({ post, onPosted, onClose }: Props) {
  const [replyText, setReplyText] = useState("");

  const handleSubmit = async () => {
    if (!replyText.trim()) return;
    try {
      await api.post("/posts/add", new URLSearchParams({
        text: replyText,
        post_metadata: JSON.stringify({}),
        is_draft: "false",
        is_reply: "true",
        parent_post_id: String(post.id),
      }));
      onPosted();
    } catch (e) {
      console.error("Error posting reply:", e);
    }
  };

  return (
    <ComposerBox
      kind="reply"
      title={`Reply to @${post.username}`}
      accent="#28a745"
      tint="#f0fff0"
      value={replyText}
      onChange={setReplyText}
      placeholder="Write a reply..."
      submitLabel="Post Reply"
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
