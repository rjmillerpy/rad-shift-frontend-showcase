"use client";
import React, { useState } from "react";
import api from "@/lib/api";
import type { Post } from "@/types/post";
import { QUOTED_TEXT_PREVIEW_CHARS } from "./constants";
import ComposerBox from "./ComposerBox";

type Props = {
  post: Post;
  onClose: () => void;
};

export default function QuoteComposer({ post, onClose }: Props) {
  const [quoteText, setQuoteText] = useState("");

  const handleSubmit = async () => {
    if (!quoteText.trim()) return;
    try {
      await api.post("/posts/add", new URLSearchParams({
        text: quoteText,
        post_metadata: JSON.stringify({}),
        is_draft: "false",
        parent_post_id: String(post.id),
      }));
      alert("Quote posted!");
      onClose();
    } catch (e) {
      console.error("Error posting quote:", e);
    }
  };

  const preview = post.text.length > QUOTED_TEXT_PREVIEW_CHARS
    ? post.text.slice(0, QUOTED_TEXT_PREVIEW_CHARS) + "…"
    : post.text;

  return (
    <ComposerBox
      kind="quote"
      title={`Quoting @${post.username}`}
      accent="#007bff"
      tint="#f0f8ff"
      value={quoteText}
      onChange={setQuoteText}
      placeholder="Add your thoughts..."
      submitLabel="Post Quote"
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div style={{ padding: "8px", background: "#fff", borderLeft: "3px solid #ccc", borderRadius: "4px", marginBottom: "8px", fontSize: "13px", color: "#555" }}>
        {preview}
      </div>
    </ComposerBox>
  );
}
