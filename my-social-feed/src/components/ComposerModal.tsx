"use client";
import React from "react";
import Modal from "@/components/Modal";
import PostComposer from "@/components/PostComposer";
import type { Post } from "@/types/post";

type Props = {
  token: string;
  quotePreview: Post | null;
  quotePostId: number | null;
  onClearQuote: () => void;
  onPostCreated: () => void;
  onClose: () => void;
};

export default function ComposerModal({
  token, quotePreview, quotePostId, onClearQuote, onPostCreated, onClose,
}: Props) {
  return (
    <Modal
      label="New post"
      onClose={onClose}
      backdropColor="rgba(0,0,0,0.5)"
      panelStyle={{
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        width: "90%",
        maxWidth: "520px",
        maxHeight: "80vh",
        overflow: "auto",
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0 }}>Create Post</h3>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
          }}
          aria-label="Close composer"
        >
          &times;
        </button>
      </div>
      <PostComposer
        token={token}
        quotePreview={quotePreview}
        onClearQuote={onClearQuote}
        onPostCreated={onPostCreated}
        quotePostId={quotePostId}
      />
    </Modal>
  );
}
