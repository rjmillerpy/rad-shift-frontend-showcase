"use client";
import React from "react";
import type { Post } from "@/types/post";

type Props = {
  drafts: Post[];
  onPublish: (postId: number) => void;
};

export default function DraftList({ drafts, onPublish }: Props) {
  if (drafts.length === 0) return <p>No drafts yet.</p>;

  return (
    <>
      {drafts.map((post, index) => (
        <div key={post.id || index} style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
          <p>{post.text}</p>
          {post.image_url && (
            <img src={post.image_url} alt="Draft"
              style={{ maxWidth: "100%", borderRadius: 10, marginTop: 10 }} />
          )}
          {post.video_url && (
            <video controls style={{ maxWidth: "100%", borderRadius: 10, marginTop: 10 }}>
              <source src={post.video_url} type="video/mp4" />
            </video>
          )}
          {post.audio_url && (
            <audio controls style={{ width: "100%", marginTop: 10 }}>
              <source src={post.audio_url} />
            </audio>
          )}
          <p style={{ fontSize: 12, color: "#666" }}>
            Saved {new Date(post.unix_timestamp * 1000).toLocaleString()}
          </p>
          <button onClick={() => onPublish(post.id)}>Publish</button>
        </div>
      ))}
    </>
  );
}
