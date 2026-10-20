"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FloatingButtons from "@/components/FloatingButtons";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";

import { COOLDOWN_MS, NAV_TRANSITION_MS, POST_PAGE_SIZE } from "./constants";
import type { NavHistoryEntry, TopicDef } from "./types";
import { extractPostCategories } from "./orbit";
import { useBubblesData } from "./useBubblesData";
import { useQuickAction } from "./useQuickAction";
import {
  useBubbleAnimation,
  useCarouselAutoRotate,
  useFocusTimer,
  useAllTopics,
  useViewportDimensions,
} from "./useAnimation";
import SessionGoalPrompt from "./SessionGoalPrompt";
import ContextBar from "./ContextBar";
import { FloatingProfileBubble } from "./ProfileBubble";
import Constellation from "./Constellation";
import OverviewBubble from "./OverviewBubble";
import FabButton from "./FabButton";

const DEPTH_GLOW_ALPHA_BASE = 15;
const DEPTH_GLOW_ALPHA_STEP = 5;
const DEPTH_GLOW_ALPHA_MAX = 40;

export default function BubblesFeedPage() {
  const router = useRouter();
  const { token } = useAuth();

  // ── Navigation & focus state ──────────────────────────────────────────────
  const [selectedTopic, setSelectedTopic] = useState<TopicDef | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postOffset, setPostOffset] = useState(0);
  const [navHistory, setNavHistory] = useState<NavHistoryEntry[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [visitedTopics, setVisitedTopics] = useState<Set<string>>(new Set());
  const [visitedPosts, setVisitedPosts] = useState<Set<number>>(new Set());
  const [lastDrillTime, setLastDrillTime] = useState(0);

  // ── Cognitive session state ───────────────────────────────────────────────
  const [sessionGoal, setSessionGoal] = useState<string | null>(null);
  const [showGoalPrompt, setShowGoalPrompt] = useState(true);
  const [depthLevel, setDepthLevel] = useState(0);
  const [focusTimerActive, setFocusTimerActive] = useState(false);

  // ── Data + animation hooks ────────────────────────────────────────────────
  const dimensions = useViewportDimensions();
  const {
    profilePic, bubbleSettings, subcategories, setSubcategories,
    posts, setPosts, loadingPosts, fetchSubcategories, fetchTopicPosts,
    resetPostState,
  } = useBubblesData(token);

  const isZoomed = !!(selectedTopic || selectedPost);
  const allTopicsList = useAllTopics(dimensions, bubbleSettings);
  const { bubbles, profileBubble } = useBubbleAnimation({
    dimensions, initialBubbles: allTopicsList, isZoomed,
  });
  const { carouselIndex, setCarouselIndex } = useCarouselAutoRotate(posts);
  const { focusTimer, setFocusTimer } = useFocusTimer(focusTimerActive);
  const handleQuickAction = useQuickAction(setPosts);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBackToOverview = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedTopic(null);
      setSelectedPost(null);
      resetPostState();
      setPostOffset(0);
      setNavHistory([]);
      setDepthLevel(0);
      setFocusTimer(0);
      setFocusTimerActive(false);
      setTransitioning(false);
    }, NAV_TRANSITION_MS);
  }, [resetPostState, setFocusTimer]);

  const handleTopicClick = (topic: TopicDef) => {
    if (Date.now() - lastDrillTime < COOLDOWN_MS) return;
    setLastDrillTime(Date.now());
    setVisitedTopics((prev) => new Set(prev).add(topic.label.toLowerCase()));
    setDepthLevel((d) => d + 1);
    setFocusTimer(0);
    setFocusTimerActive(true);
    setTransitioning(true);
    setTimeout(() => {
      setNavHistory((prev) => [...prev, { topic: selectedTopic, post: selectedPost }]);
      setSelectedTopic(topic);
      setSelectedPost(null);
      setPostOffset(0);
      resetPostState();
      void fetchTopicPosts(topic, 0);
      void fetchSubcategories(topic);
      setTransitioning(false);
    }, NAV_TRANSITION_MS);
  };

  const handlePostClick = (post: Post) => {
    if (Date.now() - lastDrillTime < COOLDOWN_MS) return;
    setLastDrillTime(Date.now());
    setVisitedPosts((prev) => new Set(prev).add(post.id));
    setDepthLevel((d) => d + 1);
    setFocusTimer(0);
    setTransitioning(true);
    setTimeout(() => {
      setNavHistory((prev) => [...prev, { topic: selectedTopic, post: selectedPost }]);
      setSelectedPost(post);
      const cats = extractPostCategories(post);
      const query = cats.length > 0 ? cats[0] : post.text.split(" ").slice(0, 3).join(" ");
      const nextTopic: TopicDef = { label: query, color: selectedTopic?.color || "#007bff", isFeed: false };
      setSelectedTopic(nextTopic);
      setPostOffset(0);
      resetPostState();
      void fetchTopicPosts(nextTopic, 0);
      setSubcategories(cats.length > 0 ? cats : []);
      setTransitioning(false);
    }, NAV_TRANSITION_MS);
  };

  const handlePaginate = () => {
    if (!selectedTopic) return;
    const newOffset = postOffset + POST_PAGE_SIZE;
    setPostOffset(newOffset);
    void fetchTopicPosts(selectedTopic, newOffset);
  };

  const handleBack = () => {
    setTransitioning(true);
    const prev = navHistory[navHistory.length - 1];
    if (!prev) { handleBackToOverview(); return; }
    setTimeout(() => {
      setNavHistory((h) => h.slice(0, -1));
      setSelectedTopic(prev.topic);
      setSelectedPost(prev.post);
      if (prev.topic) {
        resetPostState();
        setPostOffset(0);
        void fetchTopicPosts(prev.topic, 0);
        void fetchSubcategories(prev.topic);
      } else {
        handleBackToOverview();
      }
      setTransitioning(false);
    }, NAV_TRANSITION_MS);
  };

  return (
    <div style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "#0a0a0a",
      opacity: transitioning ? 0 : 1,
      transition: "opacity 0.3s ease-in-out",
    }}>
      <FloatingButtons hideProfilePic hideComposer feedSettingsPath="/settings/bubbles" />

      {showGoalPrompt && !sessionGoal && (
        <SessionGoalPrompt
          onGoalSet={(goal) => { setSessionGoal(goal); setShowGoalPrompt(false); }}
          onSkip={() => setShowGoalPrompt(false)}
        />
      )}

      {isZoomed && (
        <ContextBar
          navHistory={navHistory}
          selectedTopic={selectedTopic}
          selectedPost={selectedPost}
          sessionGoal={sessionGoal}
          focusTimer={focusTimer}
          depthLevel={depthLevel}
          onTakeBreak={handleBackToOverview}
        />
      )}

      {isZoomed && depthLevel > 1 && (
        <div data-testid="depth-glow" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: "none", zIndex: 5,
          background: `radial-gradient(circle at 50% 50%,
            ${selectedTopic?.color || "#007bff"}${Math.min(DEPTH_GLOW_ALPHA_BASE + depthLevel * DEPTH_GLOW_ALPHA_STEP, DEPTH_GLOW_ALPHA_MAX).toString(16).padStart(2, "0")} 0%,
            transparent 70%)`,
        }} />
      )}

      {token && !isZoomed && (
        <FloatingProfileBubble profilePic={profilePic} bubble={profileBubble} />
      )}

      {bubbles.map((bubble, i) => (
        <OverviewBubble
          key={i}
          bubble={bubble}
          dimIfZoomed={isZoomed}
          onClick={() => handleTopicClick({
            label: bubble.label, color: bubble.color, isFeed: bubble.isFeed, tab: bubble.tab,
          })}
        />
      ))}

      {isZoomed && (
        <Constellation
          selectedPost={selectedPost}
          selectedTopic={selectedTopic}
          posts={posts}
          subcategories={subcategories}
          dimensions={dimensions}
          token={token}
          profilePic={profilePic}
          loadingPosts={loadingPosts}
          visitedTopics={visitedTopics}
          visitedPosts={visitedPosts}
          carouselIndex={carouselIndex}
          setCarouselIndex={setCarouselIndex}
          onTopicClick={handleTopicClick}
          onPostClick={handlePostClick}
          onBack={handleBack}
          onHome={handleBackToOverview}
          onPaginate={handlePaginate}
          onQuickAction={handleQuickAction}
        />
      )}

      {token && (
        <FabButton
          testId="bubbles-post-fab"
          title="New post"
          onClick={() => router.push("/")}
          bottom={170}
          background="#007bff"
          color="#fff"
          border="none"
          fontSize={28}
          label="+"
        />
      )}
      {!token && (
        <FabButton
          testId="bubbles-login-fab"
          title="Log in"
          onClick={() => router.push("/login")}
          bottom={100}
          background="#fff"
          color="#007bff"
          border="2px solid #007bff"
          fontSize={13}
          label="Log in"
        />
      )}
    </div>
  );
}
