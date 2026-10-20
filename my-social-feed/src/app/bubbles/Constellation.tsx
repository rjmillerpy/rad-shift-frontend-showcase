"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/types/post";
import type { OrbitItem, TopicDef, ViewportSize } from "./types";
import { DEEP_READ_HOVER_MS, VIEW_SCALE_REF_PX } from "./constants";
import { arrangeOrbitBubbles, extractPostCategories, getMicroCategories } from "./orbit";
import PostHoverTooltip from "./PostHoverTooltip";
import QuickActionMenu from "./QuickActionMenu";
import { PinnedProfileBubble } from "./ProfileBubble";
import CenterBubble from "./CenterBubble";
import OrbitBubble from "./OrbitBubble";

// Orbit sizing / density — scales with viewport area so we don't cram too
// many bubbles on a tiny screen.
const CENTER_SIZE_POST_MIN = 140;
const CENTER_SIZE_POST_MAX = 200;
const CENTER_SIZE_TOPIC = 140;
const BASE_ORBIT_SIZE_PX = 100;
const ORBIT_EDGE_PADDING_PX = 80;
const ORBIT_MAX_RADIUS_FRAC = 0.42;
const VIEW_SCALE_MIN = 0.5;
const VIEW_SCALE_MAX = 1.5;
const TARGET_TOTAL_MIN = 8;
const TARGET_TOTAL_MAX = 24;
const TARGET_AREA_DIVISOR = 40_000;
const MIN_POST_BUBBLES = 3;
const MAX_SUBCATEGORY_CHIPS = 3;
const MICRO_CATEGORIES_COUNT = 3;

const POST_MIN_SIZE_MEDIA_PX = 100;
const POST_MIN_SIZE_TEXT_PX = 80;
const POST_MAX_SIZE_MEDIA_PX = 180;
const POST_MAX_SIZE_TEXT_PX = 160;
const MICRO_BUBBLE_SIZE_PX = 75;
const SUBCATEGORY_BUBBLE_SIZE_PX = 90;
const POST_SIZE_TEXT_LEN_REF = 120;

type Props = {
  selectedPost: Post | null;
  selectedTopic: TopicDef | null;
  posts: Post[];
  subcategories: string[];
  dimensions: ViewportSize;
  token: string | null;
  profilePic: string | null;
  loadingPosts: boolean;
  visitedTopics: Set<string>;
  visitedPosts: Set<number>;
  carouselIndex: Record<number, number>;
  setCarouselIndex: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onTopicClick: (topic: TopicDef) => void;
  onPostClick: (post: Post) => void;
  onBack: () => void;
  onHome: () => void;
  onPaginate: () => void;
  onQuickAction: (action: string, post: Post) => void;
};

/** The zoomed "constellation" view — a center bubble surrounded by an orbit
    of subcategory/micro/paginate/back/balloon/post bubbles connected by
    animated dashed lines. Owns its own hover-tooltip + quick-action-menu
    state; the enclosing page just supplies the navigation callbacks. */
export default function Constellation(props: Props) {
  const {
    selectedPost, selectedTopic, posts, subcategories, dimensions, token,
    profilePic, loadingPosts, visitedTopics, visitedPosts,
    carouselIndex, setCarouselIndex,
    onTopicClick, onPostClick, onBack, onHome, onPaginate, onQuickAction,
  } = props;
  const router = useRouter();

  const [hoveredPost, setHoveredPost] = useState<Post | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [hoverStartTime, setHoverStartTime] = useState(0);
  const [deepReadPosts, setDeepReadPosts] = useState<Set<number>>(new Set());
  const [quickActionPost, setQuickActionPost] = useState<Post | null>(null);
  const [quickActionPos, setQuickActionPos] = useState({ x: 0, y: 0 });

  const layout = computeLayout(dimensions, selectedTopic, selectedPost);
  const orbitItems = buildOrbitItems(layout, selectedPost, selectedTopic, subcategories, posts);
  const orbitSizes = orbitItems.map((it) => getBubbleSize(it, layout.viewScale));
  const positions = arrangeOrbitBubbles(
    layout.cx, layout.cy, orbitItems.length, layout.orbitRadius, orbitSizes, dimensions.w, dimensions.h,
  );

  return (
    <>
      {hoveredPost && (
        <PostHoverTooltip post={hoveredPost} x={hoverPos.x} y={hoverPos.y} viewport={dimensions} />
      )}

      {/* Animated dashed connection lines from center to each orbit item. */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={layout.centerColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={layout.centerColor} stopOpacity={0.15} />
          </linearGradient>
        </defs>
        {positions.map((pos, i) => (
          <g key={i}>
            <line x1={layout.cx} y1={layout.cy} x2={pos.x} y2={pos.y}
              stroke={layout.centerColor} strokeWidth={1.5} opacity={0.25} />
            <line x1={layout.cx} y1={layout.cy} x2={pos.x} y2={pos.y}
              stroke={layout.centerColor} strokeWidth={2} opacity={0.6}
              strokeDasharray="6 8"
              strokeDashoffset={0}>
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.5s" repeatCount="indefinite" />
            </line>
          </g>
        ))}
      </svg>

      <CenterBubble
        selectedPost={selectedPost}
        selectedTopic={selectedTopic}
        cx={layout.cx}
        cy={layout.cy}
        viewScale={layout.viewScale}
        centerSize={layout.centerSize}
        centerColor={layout.centerColor}
        centerLabel={layout.centerLabel}
        carouselIndex={carouselIndex}
        onCarouselChange={(postId, next) => setCarouselIndex((prev) => ({ ...prev, [postId]: next }))}
        onOpenPost={(postId) => router.push(`/post/${postId}`)}
        onContextMenu={(post, x, y) => { setQuickActionPost(post); setQuickActionPos({ x, y }); }}
      />

      {orbitItems.map((item, i) => {
        const isVisitedTopic = (item.type === "subcategory" || item.type === "micro")
          && visitedTopics.has(item.tag.toLowerCase());
        const isVisitedPost = item.type === "post" && visitedPosts.has(item.post.id);
        const isDeepRead = item.type === "post" && deepReadPosts.has(item.post.id);
        return (
          <OrbitBubble
            key={i}
            item={item}
            position={positions[i]}
            size={orbitSizes[i]}
            viewScale={layout.viewScale}
            centerColor={layout.centerColor}
            carouselIndex={carouselIndex}
            isVisitedTopic={isVisitedTopic}
            isVisitedPost={isVisitedPost}
            isDeepRead={isDeepRead}
            onBack={onBack}
            onHome={onHome}
            onPaginate={onPaginate}
            onTopicClick={(label, color) => onTopicClick({ label, color, isFeed: false })}
            onPostClick={onPostClick}
            onContextMenuPost={(post, x, y) => { setQuickActionPost(post); setQuickActionPos({ x, y }); }}
            onHoverEnter={(post, x, y) => {
              setHoveredPost(post);
              setHoverStartTime(Date.now());
              setHoverPos({ x, y });
            }}
            onHoverMove={(x, y) => setHoverPos({ x, y })}
            onHoverLeave={() => {
              if (hoveredPost && Date.now() - hoverStartTime > DEEP_READ_HOVER_MS) {
                setDeepReadPosts((prev) => new Set(prev).add(hoveredPost.id));
              }
              setHoveredPost(null);
            }}
          />
        );
      })}

      {token && <PinnedProfileBubble profilePic={profilePic} />}

      {quickActionPost && (
        <QuickActionMenu
          post={quickActionPost}
          x={quickActionPos.x}
          y={quickActionPos.y}
          onAction={(action, post) => { onQuickAction(action, post); setQuickActionPost(null); }}
          onClose={() => setQuickActionPost(null)}
        />
      )}

      {loadingPosts && (
        <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", color: "#888", fontSize: "14px" }}>
          Loading posts...
        </div>
      )}
    </>
  );
}

// ── Layout math ──────────────────────────────────────────────────────────────

type Layout = {
  cx: number; cy: number;
  viewScale: number; centerSize: number;
  centerColor: string; centerLabel: string;
  orbitRadius: number; baseOrbitSize: number;
};

function computeLayout(
  dimensions: ViewportSize, selectedTopic: TopicDef | null, selectedPost: Post | null,
): Layout {
  const cx = dimensions.w / 2;
  const cy = dimensions.h / 2;
  const viewMin = Math.min(dimensions.w, dimensions.h);
  const viewScale = Math.max(VIEW_SCALE_MIN, Math.min(VIEW_SCALE_MAX, viewMin / VIEW_SCALE_REF_PX));

  const isPostCenter = !!selectedPost;
  const centerTextLen = isPostCenter ? selectedPost!.text.length : (selectedTopic?.label.length || 0);
  const centerSize = Math.round((isPostCenter
    ? Math.max(CENTER_SIZE_POST_MIN, Math.min(CENTER_SIZE_POST_MAX, CENTER_SIZE_POST_MIN + (centerTextLen / 100) * 60))
    : CENTER_SIZE_TOPIC) * viewScale);

  const baseOrbitSize = Math.round(BASE_ORBIT_SIZE_PX * viewScale);
  const maxOrbit = (viewMin / 2) - Math.round(ORBIT_EDGE_PADDING_PX * viewScale);
  const orbitRadius = Math.min(viewMin * ORBIT_MAX_RADIUS_FRAC, maxOrbit);

  const centerColor = selectedTopic?.color || "#007bff";
  const centerMaxChars = isPostCenter ? Math.round((centerSize - 40) * 1.2) : 100;
  const centerLabel = isPostCenter
    ? (selectedPost!.text.length > centerMaxChars ? selectedPost!.text.slice(0, centerMaxChars) + "…" : selectedPost!.text)
    : (selectedTopic?.label || "");

  return { cx, cy, viewScale, centerSize, centerColor, centerLabel, orbitRadius, baseOrbitSize };
}

// ── Orbit item assembly ──────────────────────────────────────────────────────

function buildOrbitItems(
  layout: Layout,
  selectedPost: Post | null,
  selectedTopic: TopicDef | null,
  subcategories: string[],
  posts: Post[],
): OrbitItem[] {
  const isPostCenter = !!selectedPost;

  const controlBubbles: OrbitItem[] = [
    { type: "back", label: "Back" },
    { type: "balloon", label: "🎈" },
    { type: "paginate", label: "More" },
  ];

  const majorCats = isPostCenter ? extractPostCategories(selectedPost!) : [];
  const majorCatBubbles: OrbitItem[] = majorCats.map((tag) => ({
    type: "subcategory",
    label: tag.charAt(0).toUpperCase() + tag.slice(1),
    tag,
  }));

  const filteredSubs = subcategories.filter(
    (s) => !majorCats.map((c) => c.toLowerCase()).includes(s.toLowerCase()),
  );
  const subcatBubbles: OrbitItem[] = filteredSubs.slice(0, MAX_SUBCATEGORY_CHIPS).map((tag) => ({
    type: "subcategory",
    label: tag.charAt(0).toUpperCase() + tag.slice(1),
    tag,
  }));

  const topicForMicro = isPostCenter
    ? (majorCats[0] || selectedTopic?.label || "")
    : (selectedTopic?.label || "");
  const microCats = getMicroCategories(topicForMicro, MICRO_CATEGORIES_COUNT)
    .filter((m) => !subcategories.includes(m.toLowerCase()) && !majorCats.includes(m.toLowerCase()));
  const microBubbles: OrbitItem[] = microCats.map((mc) => ({
    type: "micro",
    label: mc,
    tag: mc,
  }));

  const viewArea = window.innerWidth * window.innerHeight;
  const targetTotal = Math.max(TARGET_TOTAL_MIN, Math.min(TARGET_TOTAL_MAX, Math.round(viewArea / TARGET_AREA_DIVISOR)));
  const nonPostCount = controlBubbles.length + majorCatBubbles.length + subcatBubbles.length + microBubbles.length;
  const maxPosts = Math.max(MIN_POST_BUBBLES, targetTotal - nonPostCount);
  const postBubbles: OrbitItem[] = posts
    .filter((p) => !selectedPost || p.id !== selectedPost.id)
    .slice(0, maxPosts)
    .map((p) => ({ type: "post", label: p.text, post: p }));

  return [...controlBubbles, ...majorCatBubbles, ...subcatBubbles, ...microBubbles, ...postBubbles];
}

// ── Per-item size ────────────────────────────────────────────────────────────

function getBubbleSize(item: OrbitItem, viewScale: number): number {
  if (item.type === "post") {
    const p = item.post;
    const hasMedia = !!(p.video_url || p.image_url || p.audio_url);
    const len = item.label.length;
    const minSize = Math.round((hasMedia ? POST_MIN_SIZE_MEDIA_PX : POST_MIN_SIZE_TEXT_PX) * viewScale);
    const maxSize = Math.round((hasMedia ? POST_MAX_SIZE_MEDIA_PX : POST_MAX_SIZE_TEXT_PX) * viewScale);
    const size = Math.round(minSize + Math.min(len / POST_SIZE_TEXT_LEN_REF, 1) * (maxSize - minSize));
    return Math.max(minSize, Math.min(maxSize, size));
  }
  if (item.type === "micro") return Math.round(MICRO_BUBBLE_SIZE_PX * viewScale);
  if (item.type === "subcategory") return Math.round(SUBCATEGORY_BUBBLE_SIZE_PX * viewScale);
  return Math.round(BASE_ORBIT_SIZE_PX * viewScale);
}
