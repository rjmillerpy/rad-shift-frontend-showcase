"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import { normalizePost } from "@/lib/postUtils";
import { PAGE_SIZE } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import type { Post } from "@/types/post";
import EmailVerificationBanner from "./EmailVerificationBanner";
import FeedTabs from "./FeedTabs";
import FloatingActions from "./FloatingActions";
import ComposerModal from "@/components/ComposerModal";
import LoadMoreButton from "./LoadMoreButton";
import ProfileAvatarButton from "./ProfileAvatarButton";
import { SHARE_ANIMATION_MS } from "./constants";
import { useReplies } from "@/hooks/useReplies";

type FeedTab = "algo" | "following";

export default function Home() {
  const router = useRouter();
  const { token, emailVerified, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>("algo");
  const [quotePostId, setQuotePostId] = useState<number | null>(null);
  const [quotePreview, setQuotePreview] = useState<Post | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const { replyProps } = useReplies();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/profile/me");
      if (res.data.profile_picture_url) {
        setProfilePic(res.data.profile_picture_url);
      }
    } catch (error: unknown) {
      // Defense in depth: the api response interceptor also handles 401 with a
      // hard redirect, but we clear + soft-nav here for a smoother UX and so
      // stale tokens fail cleanly even when the interceptor is stubbed (tests).
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401 || status === 422) {
          logout();
          setProfilePic(null);
          router.push("/login");
          return;
        }
      }
      console.error("Error fetching profile picture:", error);
    }
  }, [logout, router]);

  const fetchPosts = useCallback(async (tab: FeedTab, append = false, offset = 0) => {
    try {
      const url = tab === "following" && token ? "/posts/following" : "/posts/algo";
      const response = await api.get(url, { params: { offset, limit: PAGE_SIZE } });
      const processedPosts: Post[] = response.data.posts.map((post: Post) => ({
        ...normalizePost(post),
        is_me: post.is_me ?? false,
      }));
      setPosts((prev) => (append ? [...prev, ...processedPosts] : processedPosts));
      setHasMore(response.data.has_more ?? false);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [token]);

  useEffect(() => {
    void fetchPosts("algo");
  }, [fetchPosts]);

  useEffect(() => {
    if (token) void fetchProfile();
  }, [token, fetchProfile]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPosts(activeTab, true, posts.length);
    setLoadingMore(false);
  };

  // The feed quotes into its own composer instead of opening the post page.
  const handleQuote = useCallback((postId: number) => {
    const quoted = posts.find((p) => p.id === postId);
    if (!quoted) return;
    setQuotePostId(quoted.id);
    setQuotePreview(quoted);
    setComposerOpen(true);
  }, [posts]);

  const actions = usePostInteractions(setPosts, { onQuote: handleQuote });

  // The share button flashes before the clipboard write resolves.
  const handleShare = useCallback((postId: number) => {
    const button = document.getElementById(`share-btn-${postId}`);
    if (button) {
      button.classList.add("clicked");
      setTimeout(() => button.classList.remove("clicked"), SHARE_ANIMATION_MS);
    }
    return actions.onShare(postId);
  }, [actions]);

  const handleTabChange = (tab: string) => {
    const nextTab = tab as FeedTab;
    setActiveTab(nextTab);
    void fetchPosts(nextTab);
  };

  const handleLogout = () => {
    logout();
    setProfilePic(null);
  };

  const clearQuote = () => {
    setQuotePostId(null);
    setQuotePreview(null);
  };

  const handleCloseComposer = () => {
    setComposerOpen(false);
    clearQuote();
  };

  const handlePostCreated = () => {
    setComposerOpen(false);
    clearQuote();
    void fetchPosts(activeTab);
  };

  const tabs: FeedTab[] = token ? ["algo", "following"] : ["algo"];

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto", position: "relative" }}>
      {token && (
        <ProfileAvatarButton profilePic={profilePic} onClick={() => router.push("/profile")} />
      )}

      <h2>Welcome to the Feed</h2>
      {!token ? (
        <div style={{ marginBottom: "20px" }}>
          <Link href="/signup" style={{ marginRight: "10px" }}>Signup</Link>
          <Link href="/login">Login</Link>
        </div>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}

      {token && !emailVerified && <EmailVerificationBanner />}

      <FeedTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      <h3>{activeTab === "algo" ? "Algo Feed" : "Following"}</h3>
      <div>
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} {...actions} onShare={handleShare} {...replyProps} />
        ))}
      </div>

      {hasMore && <LoadMoreButton loading={loadingMore} onLoadMore={loadMore} />}

      <FloatingActions showNewPost={!!token} onNewPost={() => setComposerOpen(true)} />

      {composerOpen && token && (
        <ComposerModal
          token={token}
          quotePreview={quotePreview}
          quotePostId={quotePostId}
          onClearQuote={clearQuote}
          onPostCreated={handlePostCreated}
          onClose={handleCloseComposer}
        />
      )}
    </div>
  );
}
