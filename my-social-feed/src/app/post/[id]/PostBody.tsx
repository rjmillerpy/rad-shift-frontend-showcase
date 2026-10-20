"use client";
import React from "react";
import Link from "next/link";
import PostActions from "@/components/PostActions";
import { postActionState } from "@/components/postActionState";
import { hasExpandableMetadata } from "@/components/PostMetadataExpansion";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";
import { HEX_AVATAR_CLIP } from "./constants";

type Props = {
  post: Post;
  token: string | null;
  expandedMetadata: boolean;
  onToggleMetadata: () => void;
  onFollowToggle: (username: string, isFollowed: boolean) => void;
  onToggleLike: (postId: number) => void;
  onRepost: (postId: number) => void;
  onShare: (postId: number) => void;
  onToggleSave: (postId: number) => Promise<boolean> | boolean;
  onToggleLaugh: (postId: number) => void;
  onMarkSlop: (postId: number, reason: string) => void;
  onReport: (postId: number, reason: string) => void;
  onQuote: () => void;
  onToggleReplies: (postId: number) => void;
};

export default function PostBody({
  post,
  token,
  expandedMetadata,
  onToggleMetadata,
  onFollowToggle,
  onToggleLike,
  onRepost,
  onShare,
  onToggleSave,
  onToggleLaugh,
  onMarkSlop,
  onReport,
  onQuote,
  onToggleReplies,
}: Props) {
  const showMetadata = expandedMetadata && hasExpandableMetadata(post.post_metadata);

  return (
    <div
      id={`post-${post.id}`}
      style={{
        marginTop: "20px",
        padding: "24px 24px 24px 110px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        position: "relative",
        background: "#fff",
      }}
    >
      {/* Large avatar */}
      <Link href={`/profile/${post.username}`}>
        <img
          data-avatar="hex"
          src={proxyIfNeeded(post.profile_picture_url || DEFAULT_AVATAR)}
          crossOrigin="anonymous"
          alt="Profile"
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            position: "absolute",
            top: "24px",
            left: "16px",
            clipPath: HEX_AVATAR_CLIP,
            WebkitClipPath: HEX_AVATAR_CLIP,
          }}
        />
      </Link>

      <div>
        {/* Username + follow */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href={`/profile/${post.username}`}
            style={{ textDecoration: "none", color: "#333", fontWeight: "bold", fontSize: "18px" }}
          >
            {post.username}
          </Link>
          {token && !post.is_me && (
            <button
              onClick={() => onFollowToggle(post.username, !!post.is_followed_by_me)}
              title={post.is_followed_by_me ? "Unfollow" : "Follow"}
              style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}
            >
              <img
                src="/follow.png"
                alt={post.is_followed_by_me ? "Unfollow" : "Follow"}
                height={28}
                width={28}
                style={{
                  borderRadius: "4px",
                  objectFit: "cover",
                  filter: post.is_followed_by_me
                    ? "brightness(0.9) sepia(1) hue-rotate(120deg) saturate(400%) contrast(1.1)"
                    : "none",
                  transition: "filter 0.2s ease-in-out",
                }}
              />
            </button>
          )}
        </div>

        {post.reposted_by && post.reposted_by.length > 0 && (
          <div style={{ fontSize: "13px", color: "gray", marginTop: "4px" }}>
            Reposted by {post.reposted_by.join(", ")}
          </div>
        )}

        {/* Post text */}
        <p style={{ fontSize: "18px", lineHeight: "1.5", margin: "12px 0", whiteSpace: "pre-wrap" }}>
          {post.text}
        </p>

        {/* Quoted post */}
        {post.quoted_post && (
          <Link href={`/post/${post.quoted_post.id}`} style={{ textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                borderLeft: "3px solid #ccc",
                borderRadius: 6,
                background: "#fafafa",
                fontSize: "14px",
                color: "#555",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: "bold" }}>Quoting @{post.quoted_post.username}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {"❝"}{post.quoted_post.text}{"❞"}
              </div>
            </div>
          </Link>
        )}

        {/* Media */}
        {post.image_url && (
          <img
            src={proxyIfNeeded(post.image_url)}
            crossOrigin="anonymous"
            alt="Post"
            style={{ maxWidth: "100%", borderRadius: "12px", marginTop: "12px" }}
          />
        )}
        {post.video_url && (
          <video controls style={{ maxWidth: "100%", borderRadius: "12px", marginTop: "12px" }}>
            <source src={post.video_url} type="video/mp4" />
          </video>
        )}
        {post.audio_url && (
          <audio controls style={{ width: "100%", marginTop: "12px" }}>
            <source src={post.audio_url} />
          </audio>
        )}

        {/* Metadata */}
        {showMetadata && post.post_metadata && (
          <div style={{ fontSize: "13px", color: "#555", marginTop: "8px" }}>
            {post.post_metadata.tags && (
              <div>
                <strong>Tags:</strong>{" "}
                {Array.isArray(post.post_metadata.tags) ? post.post_metadata.tags.join(", ") : post.post_metadata.tags}
              </div>
            )}
            {(post.post_metadata.tagged_users?.length ?? 0) > 0 && (
              <div><strong>Tagged:</strong> {post.post_metadata.tagged_users!.join(", ")}</div>
            )}
            {post.post_metadata.location && (
              <div><strong>Location:</strong> {post.post_metadata.location}</div>
            )}
          </div>
        )}

        <PostActions
          {...postActionState(post)}
          index={0}
          metadataExpanded={expandedMetadata}
          onToggleMetadata={onToggleMetadata}
          onToggleLike={onToggleLike}
          onRepost={onRepost}
          onShare={onShare}
          onToggleSave={onToggleSave}
          onToggleLaugh={onToggleLaugh}
          onMarkSlop={onMarkSlop}
          onReport={onReport}
          onQuote={onQuote}
          onToggleReplies={onToggleReplies}
        />

        <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
          {new Date(post.unix_timestamp * 1000).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
