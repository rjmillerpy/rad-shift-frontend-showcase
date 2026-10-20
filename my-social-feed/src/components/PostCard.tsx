"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PostActions from "@/components/PostActions";
import { postActionState } from "@/components/postActionState";
import ReplyThread from "@/components/ReplyThread";
import AudioPlayer from "@/components/AudioPlayer";
import VideoPlayer from "@/components/VideoPlayer";
import QuotedPostPreview from "@/components/QuotedPostPreview";
import PostMetadataExpansion from "@/components/PostMetadataExpansion";
import PostSourceBadge from "@/components/PostSourceBadge";
import LinkCard from "@/components/LinkCard";
const ImageGallery = dynamic(() => import("@/components/ImageGallery"), { ssr: false });
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import type { Post } from "@/types/post";

type PostCardProps = {
  post: Post;
  index: number;
  token: string | null;
  onToggleLike: (postId: number) => void | Promise<void>;
  onRepost: (postId: number) => void | Promise<void>;
  onShare: (postId: number) => void | Promise<void>;
  onToggleSave: (postId: number) => Promise<boolean> | boolean;
  onToggleLaugh: (postId: number) => void | Promise<void>;
  onMarkSlop: (postId: number, reason: string) => Promise<void> | void;
  onReport: (postId: number, reason: string) => Promise<void> | void;
  onQuote: (postId: number) => void;
  onFollowToggle: (username: string, isFollowed: boolean) => void;
  onToggleReplies: (postId: number) => void;
  onFetchReplies: (postId: number) => Promise<void>;
  openReplies: Record<number, boolean>;
  repliesByPost: Record<number, Post[]>;
};

function PostCard({
  post,
  index,
  token,
  onToggleLike,
  onRepost,
  onShare,
  onToggleSave,
  onToggleLaugh,
  onMarkSlop,
  onReport,
  onQuote,
  onFollowToggle,
  onToggleReplies,
  onFetchReplies,
  openReplies,
  repliesByPost,
}: PostCardProps) {
  const [expandedMetadata, setExpandedMetadata] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [hoveredPost, setHoveredPost] = useState(false);
  const defaultAvatar = DEFAULT_AVATAR;
  const sourceMeta = post.post_metadata?.source;
  const linkCard = post.post_metadata?.link_card;

  return (
    <div
      id={`post-${post.id}`}
      style={{
        padding: "10px 10px 10px 80px",
        borderBottom: "1px solid #ccc",
        position: "relative",
        background: "#fff",
      }}
    >
      <Link href={`/profile/${post.username}`}>
        <img
          data-avatar="hex"
          src={proxyIfNeeded(post.profile_picture_url || defaultAvatar)}
          crossOrigin="anonymous"
          alt="Profile"
          style={{
            width: "60px",
            height: "60px",
            objectFit: "cover",
            position: "absolute",
            top: "10px",
            left: "10px",
            marginTop: "5px",
            clipPath:
              "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            WebkitClipPath:
              "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
          }}
        />
      </Link>

      <div>
        <Link
          href={`/profile/${post.username}`}
          style={{
            textDecoration: "none",
            color: "#333",
            fontWeight: "bold",
            marginLeft: "5px",
          }}
        >
          {post.username}
        </Link>
        {token && post.username !== undefined && !post.is_me && (
          <button
            onClick={() =>
              onFollowToggle(post.username, !!post.is_followed_by_me)
            }
            title={post.is_followed_by_me ? "Unfollow" : "Follow"}
            style={{
              marginLeft: "10px",
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              verticalAlign: "middle",
            }}
          >
            <img
              src="/follow.png"
              alt={post.is_followed_by_me ? "Unfollow" : "Follow"}
              height={42}
              width={42}
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
        {post.reposted_by && post.reposted_by.length > 0 && (
          <div
            style={{ fontSize: "12px", color: "gray", marginLeft: "5px" }}
          >
            Reposted by {post.reposted_by.join(", ")}
          </div>
        )}
        {sourceMeta && !linkCard && <PostSourceBadge source={sourceMeta} />}

        {!linkCard && (
          <Link
            href={`/post/${post.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
            onMouseEnter={() => setHoveredPost(true)}
            onMouseLeave={() => setHoveredPost(false)}
          >
            <p style={{
              margin: "5px 0",
              marginLeft: "5px",
              cursor: "pointer",
              borderRadius: "6px",
              padding: "4px 6px",
              background: hoveredPost ? "#f0f0f0" : "transparent",
              transition: "background 0.15s ease-in-out",
            }}>{post.text}</p>
          </Link>
        )}

        {linkCard && (
          <LinkCard linkCard={linkCard} source={sourceMeta} bodyText={post.text} />
        )}

        {post.quoted_post && <QuotedPostPreview quotedPost={post.quoted_post} />}

        {(post.image_urls && post.image_urls.length > 1) ? (
          <ImageGallery images={post.image_urls} />
        ) : post.image_url ? (
          <img
            src={proxyIfNeeded(post.image_url)}
            crossOrigin="anonymous"
            alt="Post"
            style={{
              maxWidth: "100%",
              borderRadius: "10px",
              marginTop: "10px",
            }}
          />
        ) : null}

        {post.video_url && (
          <VideoPlayer src={post.video_url} metadata={post.media_metadata} />
        )}

        {post.audio_url && (
          <AudioPlayer
            src={post.audio_url}
            postId={post.id}
            username={post.username}
            text={post.text}
            metadata={post.media_metadata}
          />
        )}

        {post.post_metadata && expandedMetadata && (
          <PostMetadataExpansion metadata={post.post_metadata} />
        )}

        <button
          type="button"
          onClick={() => setShowActions((prev) => !prev)}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "4px 0",
            fontSize: "13px",
            color: "#007bff",
            marginTop: "4px",
          }}
        >
          {showActions ? "Hide interactions" : "Show interactions"}
        </button>

        {showActions && (
          <PostActions
            {...postActionState(post)}
            index={index}
            metadataExpanded={expandedMetadata}
            onToggleMetadata={() => setExpandedMetadata((prev) => !prev)}
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
        )}

        <ReplyThread
          parentId={post.id}
          token={token}
          openReplies={openReplies}
          repliesByPost={repliesByPost}
          onToggleReplies={onToggleReplies}
          onFetchReplies={onFetchReplies}
          onToggleLike={onToggleLike}
          onRepost={onRepost}
          onShare={onShare}
          onToggleSave={onToggleSave}
          onToggleLaugh={onToggleLaugh}
          onMarkSlop={onMarkSlop}
          onReport={onReport}
          onQuote={onQuote}
        />

        <p style={{ fontSize: "12px", color: "#666" }}>
          {new Date(post.unix_timestamp * 1000).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default React.memo(PostCard);
