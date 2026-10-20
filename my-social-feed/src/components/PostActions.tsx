"use client";
import { useState } from "react";
import {
  sanitizeFilename,
  extensionFromUrl,
  downloadMedia,
  capturePostScreenshot,
} from "@/lib/postCapture";
import SlopModal from "./SlopModal";
import ReportModal from "./ReportModal";
import IconActionButton from "./IconActionButton";
import {
  LIKE_ACTIVE, LIKE_HOVER,
  REPOST_ACTIVE_OR_HOVER,
  SAVE_ACTIVE, SAVE_HOVER,
  TAG_ACTIVE, TAG_HOVER,
  BROWN_ACTIVE, BROWN_HOVER,
  RED_ACTIVE, RED_HOVER,
  LAUGH_ACTIVE_FILTER, LAUGH_HOVER_FILTER, LAUGH_IDLE_FILTER,
  ICON_SIZE_FULL, ICON_SIZE_COMPACT,
  COUNT_FONT_FULL, COUNT_FONT_COMPACT,
} from "./postActionFilters";

type PostActionsProps = {
  postId: number;
  index: number;
  posterUsername: string;
  videoUrl?: string;
  audioUrl?: string;
  likedByMe?: boolean;
  repostedByMe?: boolean;
  savedByMe?: boolean;
  laughedByMe?: boolean;
  counts: {
    likes: number;
    reposts: number;
    shares: number;
    saves?: number;
    laughs?: number;
    replies?: number;
    quotes?: number;
    slop?: number;
  };
  hasMetadata: boolean;
  metadataExpanded: boolean;
  onToggleMetadata: (index: number) => void;
  onToggleLike: (postId: number) => void | Promise<void>;
  onRepost: (postId: number) => void | Promise<void>;
  onShare: (postId: number) => void | Promise<void>;
  onToggleSave: (postId: number) => Promise<boolean> | boolean;
  onToggleLaugh: (postId: number) => void | Promise<void>;
  captureElementId: string;
  onMarkSlop: (postId: number, reason: string) => Promise<void> | void;
  onReport: (postId: number, reason: string) => Promise<void> | void;
  onQuote?: (postId: number) => void;
  onToggleReplies?: (postId: number) => void;
  variant?: "full" | "compact";
  hideLike?: boolean;
  hideRepost?: boolean;
  hideSlop?: boolean;
  hideShare?: boolean;
  hideSave?: boolean;
  hideQuote?: boolean;
  hideReport?: boolean;
  hideLaugh?: boolean;
  hideCounts?: boolean;
  iconSize?: number;
};

// Was 7 separate hover useState calls — collapsed to a single tag string.
type HoveredAction = "tag" | "like" | "repost" | "laugh" | "save" | "slop" | "report" | null;

export default function PostActions(props: PostActionsProps) {
  const {
    postId, index, posterUsername, videoUrl, audioUrl,
    likedByMe, repostedByMe, savedByMe, laughedByMe,
    counts, hasMetadata, metadataExpanded, onToggleMetadata,
    onToggleLike, onRepost, onShare, onToggleSave, onToggleLaugh,
    captureElementId, onMarkSlop, onReport, onQuote, onToggleReplies,
    variant = "full",
    hideLike = false, hideRepost = false, hideSlop = false,
    hideShare = false, hideSave = false, hideQuote = false,
    hideReport = false, hideLaugh = false, hideCounts = false,
    iconSize,
  } = props;

  const ICON = iconSize ?? (variant === "compact" ? ICON_SIZE_COMPACT : ICON_SIZE_FULL);
  const COUNT_FONT = variant === "compact" ? COUNT_FONT_COMPACT : COUNT_FONT_FULL;

  const [hovered, setHovered] = useState<HoveredAction>(null);
  const [slopOpen, setSlopOpen] = useState(false);
  const [slopActive, setSlopActive] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportActive, setReportActive] = useState(false);

  const handleSaveClick = async () => {
    if (savedByMe) {
      await onToggleSave(postId);
      return;
    }
    const nowSaved = await onToggleSave(postId);
    if (!nowSaved) return;
    // On first save also stash media so the user has an offline copy.
    if (videoUrl) {
      downloadMedia(videoUrl, buildMediaFilename(postId, posterUsername, extensionFromUrl(videoUrl, "mp4")));
    } else if (audioUrl) {
      downloadMedia(audioUrl, buildMediaFilename(postId, posterUsername, extensionFromUrl(audioUrl, "mp3")));
    }
    await capturePostScreenshot(captureElementId, postId, posterUsername);
  };

  const countSpan = (n: number) => !hideCounts && (
    <span style={{ fontSize: COUNT_FONT }}>{n}</span>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", marginTop: "5px", gap: "4px" }}>
        {hasMetadata && (
          <IconActionButton
            iconSrc="/tags.png" iconAlt="Tag" iconSize={ICON} title="Toggle metadata"
            onClick={() => onToggleMetadata(index)}
            filter={metadataExpanded ? TAG_ACTIVE : hovered === "tag" ? TAG_HOVER : undefined}
            onMouseEnter={() => setHovered("tag")}
            onMouseLeave={() => setHovered(null)}
          />
        )}

        {!hideRepost && (
          <>
            <IconActionButton
              iconSrc="/repost.png" iconAlt="Repost" iconSize={ICON} title="Repost"
              onClick={() => onRepost(postId)}
              filter={repostedByMe || hovered === "repost" ? REPOST_ACTIVE_OR_HOVER : undefined}
              onMouseEnter={() => setHovered("repost")}
              onMouseLeave={() => setHovered(null)}
            />
            {countSpan(counts.reposts || 0)}
          </>
        )}

        {!hideLike && (
          <>
            <IconActionButton
              iconSrc="/like.png" iconAlt="Like" iconSize={ICON} title="Like"
              onClick={() => onToggleLike(postId)}
              filter={likedByMe ? LIKE_ACTIVE : hovered === "like" ? LIKE_HOVER : undefined}
              onMouseEnter={() => setHovered("like")}
              onMouseLeave={() => setHovered(null)}
            />
            {countSpan(counts.likes || 0)}
          </>
        )}

        {!hideLaugh && (
          <>
            <button onClick={() => onToggleLaugh(postId)} title="Laugh"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <span
                style={{
                  fontSize: ICON * 0.45, display: "inline-block",
                  transition: "filter 0.2s ease-in-out",
                  filter: laughedByMe ? LAUGH_ACTIVE_FILTER
                    : hovered === "laugh" ? LAUGH_HOVER_FILTER
                    : LAUGH_IDLE_FILTER,
                }}
                onMouseEnter={() => setHovered("laugh")}
                onMouseLeave={() => setHovered(null)}
              >
                😂
              </span>
            </button>
            {countSpan(counts.laughs || 0)}
          </>
        )}

        {!hideShare && (
          <>
            <IconActionButton
              buttonId={`share-btn-${postId}`}
              buttonClassName="share-button"
              iconSrc="/share.png" iconAlt="Share"
              iconSize={variant === "compact" ? 10 : 24}
              title="Share"
              onClick={() => onShare(postId)}
            />
            {countSpan(counts.shares || 0)}
          </>
        )}

        {!hideSave && (
          <>
            <IconActionButton
              iconSrc="/save.png" iconAlt="Save" iconSize={ICON}
              title="Save (and download media/screenshot)"
              onClick={handleSaveClick}
              filter={savedByMe ? SAVE_ACTIVE : hovered === "save" ? SAVE_HOVER : undefined}
              onMouseEnter={() => setHovered("save")}
              onMouseLeave={() => setHovered(null)}
            />
            {countSpan(counts.saves ?? 0)}
          </>
        )}

        {!hideSlop && (
          <>
            <IconActionButton
              iconSrc="/slop.png" iconAlt="Slop" iconSize={ICON} title="Mark as Slop"
              onClick={() => setSlopOpen(true)}
              transitionMs={150}
              filter={slopActive ? BROWN_ACTIVE : hovered === "slop" ? BROWN_HOVER : undefined}
              onMouseEnter={() => setHovered("slop")}
              onMouseLeave={() => { setHovered(null); setSlopActive(false); }}
              onMouseDown={() => setSlopActive(true)}
              onMouseUp={() => setSlopActive(false)}
            />
            {countSpan(counts.slop ?? 0)}
          </>
        )}

        {!hideReport && (
          <IconActionButton
            iconSrc="/report.png" iconAlt="Report" iconSize={ICON} title="Report"
            onClick={() => setReportOpen(true)}
            transitionMs={150}
            filter={reportActive ? RED_ACTIVE : hovered === "report" ? RED_HOVER : undefined}
            onMouseEnter={() => setHovered("report")}
            onMouseLeave={() => { setHovered(null); setReportActive(false); }}
            onMouseDown={() => setReportActive(true)}
            onMouseUp={() => setReportActive(false)}
          />
        )}

        {!hideQuote && onQuote && (
          <>
            <IconActionButton
              iconSrc="/quote.png" iconAlt="Quote" iconSize={ICON} title="Quote"
              onClick={() => onQuote(postId)}
            />
            {countSpan(counts.quotes ?? 0)}
          </>
        )}

        {onToggleReplies && (
          <>
            <IconActionButton
              iconSrc="/reply.png" iconAlt="Replies" iconSize={ICON} title="Show replies"
              onClick={() => onToggleReplies(postId)}
            />
            {countSpan(counts.replies ?? 0)}
          </>
        )}
      </div>

      {slopOpen && (
        <SlopModal postId={postId} onSubmit={onMarkSlop} onClose={() => setSlopOpen(false)} />
      )}
      {reportOpen && (
        <ReportModal postId={postId} onSubmit={onReport} onClose={() => setReportOpen(false)} />
      )}
    </>
  );
}

function buildMediaFilename(postId: number, username: string, ext: string): string {
  return `post_${postId}_${sanitizeFilename(username)}.${ext}`;
}
