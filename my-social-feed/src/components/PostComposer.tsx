"use client";
import { useState } from "react";
import api from "@/lib/api";
import type { Post } from "@/types/post";
import FileUploader, { UploadFile, getFileCategory } from "./FileUploader";

type PostComposerProps = {
  token: string;
  quotePreview: Post | null;
  onClearQuote: () => void;
  onPostCreated: () => void;
  quotePostId: number | null;
};

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export default function PostComposer({
  quotePreview,
  onClearQuote,
  onPostCreated,
  quotePostId,
}: PostComposerProps) {
  const [newPost, setNewPost] = useState("");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showMetadata, setShowMetadata] = useState(false);
  const [tags, setTags] = useState("");
  const [taggedUsers, setTaggedUsers] = useState("");
  const [location, setLocation] = useState("");

  const submitPost = async (isDraft: boolean) => {
    if (!newPost.trim()) return;

    const validFiles = uploadFiles.filter((uf) => !uf.error);

    const formData = new FormData();
    formData.append("text", newPost);

    const images: File[] = [];
    const documents: File[] = [];
    let video: File | null = null;
    let audio: File | null = null;

    for (const uf of validFiles) {
      const ext = getExtension(uf.file.name);
      const cat = getFileCategory(ext);
      if (cat === "image") images.push(uf.file);
      else if (cat === "video" && !video) video = uf.file;
      else if (cat === "audio" && !audio) audio = uf.file;
      else documents.push(uf.file);
    }

    if (images.length === 1) {
      formData.append("image", images[0]);
    } else if (images.length > 1) {
      images.forEach((img) => formData.append("images", img));
    }
    if (video) formData.append("video", video);
    if (audio) formData.append("audio", audio);
    documents.forEach((doc) => formData.append("documents", doc));

    const postMetadata = JSON.stringify({
      tags,
      tagged_users: taggedUsers.split(",").map((u) => u.trim()).filter(Boolean),
      location,
    });
    formData.append("post_metadata", postMetadata);
    formData.append("is_draft", String(isDraft));
    if (quotePostId !== null) {
      formData.append("parent_post_id", String(quotePostId));
    }

    try {
      await api.post("/posts/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setNewPost("");
      setUploadFiles([]);
      setTags("");
      setTaggedUsers("");
      setLocation("");
      setShowMetadata(false);
      onClearQuote();

      if (!isDraft) {
        onPostCreated();
      } else {
        alert("Draft saved");
      }
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} encType="multipart/form-data">
      <input
        type="text"
        placeholder="Write a post..."
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      {quotePreview && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 8,
            marginBottom: 10,
            fontSize: 12,
            background: "#fafafa",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            Quoting @{quotePreview.username}
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {quotePreview.text.length > 200
              ? quotePreview.text.slice(0, 200) + "\u2026"
              : quotePreview.text}
          </div>
          <button
            type="button"
            onClick={onClearQuote}
            style={{
              marginTop: 4,
              fontSize: 11,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#888",
            }}
          >
            Clear quote
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "10px",
          gap: "10px",
        }}
      >
        <div style={{ flex: 1 }}>
          <FileUploader files={uploadFiles} onFilesChange={setUploadFiles} />
        </div>
        <button
          type="button"
          onClick={() => setShowMetadata(!showMetadata)}
          title="Toggle Metadata"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          <img src="/tags.png" alt="Toggle Metadata" width={70} height={70} />
        </button>
      </div>

      {showMetadata && (
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Tags (pipe-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          />
          <input
            type="text"
            placeholder="Tag users (comma-separated usernames)"
            value={taggedUsers}
            onChange={(e) => setTaggedUsers(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => submitPost(false)}
        style={{ marginRight: "8px" }}
      >
        Post
      </button>
      <button type="button" onClick={() => submitPost(true)}>
        Save Draft
      </button>
    </form>
  );
}
