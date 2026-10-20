"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { normalizePost } from "@/lib/postUtils";
import type { Post } from "@/types/post";
import type { BubbleSettings, TopicDef } from "./types";
import { POST_PAGE_SIZE } from "./constants";

const SUBCATEGORY_TAG_LIMIT = 8;
const SEARCH_POSTS_TAG_SAMPLE = 50;
const MAX_SUBCATEGORIES_PER_TOPIC = 4;

/**
 * Owns everything the Bubbles page needs from the network: the user's profile
 * picture, their custom/hidden topic list, the list of subcategories for a
 * selected topic, and the paginated post feed for the currently-focused topic.
 *
 * Kept as a hook so the page component stays a pure orchestrator and the
 * fetch/response-normalisation logic can be tested independently.
 */
export function useBubblesData(token: string | null) {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [bubbleSettings, setBubbleSettings] = useState<BubbleSettings>({
    custom_topics: [],
    hidden_topics: [],
  });
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Fetch profile pic + bubble settings whenever the token becomes available.
  useEffect(() => {
    if (!token) return;
    api.get("/profile/me")
      .then((res) => { if (res.data.profile_picture_url) setProfilePic(res.data.profile_picture_url); })
      .catch((e) => { console.error("Profile fetch failed:", e); });
    api.get("/profile/me/bubble-settings")
      .then((res) => setBubbleSettings({
        custom_topics: res.data.custom_topics || [],
        hidden_topics: res.data.hidden_topics || [],
      }))
      .catch((e) => { console.error("Bubble settings fetch failed:", e); });
  }, [token]);

  const fetchSubcategories = useCallback(async (topic: TopicDef) => {
    try {
      if (topic.isFeed && topic.tab) {
        // Feed tabs have a dedicated /tags endpoint.
        const res = await api.get("/posts/tags", {
          params: { feed: topic.tab, limit: SUBCATEGORY_TAG_LIMIT },
        });
        setSubcategories((res.data.tags || [])
          .filter((t: string) => t.toLowerCase() !== topic.label.toLowerCase())
          .slice(0, MAX_SUBCATEGORIES_PER_TOPIC));
      } else {
        // General topics: sample recent posts matching the topic and extract
        // unique co-tags from their metadata.
        const res = await api.get("/posts/search/posts", {
          params: { q: topic.label, limit: SEARCH_POSTS_TAG_SAMPLE },
        });
        const tagSet = new Set<string>();
        for (const p of res.data.posts || []) {
          collectPostTags(p, tagSet, topic.label);
        }
        setSubcategories(Array.from(tagSet).slice(0, MAX_SUBCATEGORIES_PER_TOPIC));
      }
    } catch (e) {
      console.error("Error fetching subcategories:", e);
      setSubcategories([]);
    }
  }, []);

  const fetchTopicPosts = useCallback(async (topic: TopicDef, offset: number) => {
    setLoadingPosts(true);
    try {
      const { url, params } = resolveTopicRequest(topic, offset);
      const res = await api.get(url, { params });
      const newPosts: Post[] = (res.data.posts || []).map((p: Post) => ({
        ...normalizePost(p),
        is_me: p.is_me ?? false,
      }));
      setPosts((prev) => (offset === 0 ? newPosts : [...prev, ...newPosts]));
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const resetPostState = useCallback(() => {
    setPosts([]);
    setSubcategories([]);
  }, []);

  return {
    profilePic,
    bubbleSettings,
    subcategories,
    setSubcategories,
    posts,
    setPosts,
    loadingPosts,
    fetchSubcategories,
    fetchTopicPosts,
    resetPostState,
  };
}

// ── Private helpers ──────────────────────────────────────────────────────────

/** Route a topic to its backend endpoint. Feed tabs hit the ordered feed
    routes; general topics hit the search endpoint with the topic as `q`. */
function resolveTopicRequest(topic: TopicDef, offset: number) {
  const params: Record<string, string | number> = { offset, limit: POST_PAGE_SIZE };
  if (topic.isFeed && topic.tab === "algo") return { url: "/posts/algo", params };
  if (topic.isFeed && topic.tab === "following") return { url: "/posts/following", params };
  return { url: "/posts/search/posts", params: { ...params, q: topic.label } };
}

/** Add every co-tag from a search-response post to `tagSet` (excluding the
    topic label itself so we don't recommend a topic back to the user). */
function collectPostTags(p: Post, tagSet: Set<string>, topicLabel: string): void {
  const meta = p.post_metadata;
  if (!meta) return;
  // Older rows store tags as a pipe-joined string rather than an array.
  const tags = meta.tags as string[] | string | undefined;
  const lowerTopic = topicLabel.toLowerCase();
  if (typeof tags === "string") {
    for (const t of tags.split("|")) {
      const trimmed = t.trim();
      if (trimmed && trimmed.toLowerCase() !== lowerTopic) tagSet.add(trimmed);
    }
  } else if (Array.isArray(tags)) {
    for (const t of tags) {
      if (typeof t === "string" && t.trim() && t.trim().toLowerCase() !== lowerTopic) {
        tagSet.add(t.trim());
      }
    }
  }
}
