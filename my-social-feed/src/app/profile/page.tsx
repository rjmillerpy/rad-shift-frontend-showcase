"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import PostCard from "@/components/PostCard";
import FloatingButtons from "@/components/FloatingButtons";
import { useAuth } from "@/hooks/useAuth";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import { useReplies } from "@/hooks/useReplies";
import type { Post } from "@/types/post";
import type { Profile } from "@/types/profile";
import ProfileHeader from "./ProfileHeader";
import DraftList from "./DraftList";

const TABS = ["posts", "saved", "drafts"] as const;
type ProfileTab = (typeof TABS)[number];

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/profile/me");
      const sortedPosts = [...(res.data.posts || [])].sort(
        (a: Post, b: Post) => b.unix_timestamp - a.unix_timestamp
      );
      setProfile({ ...res.data, posts: sortedPosts });
      setBio(res.data.bio || "");
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  }, []);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await api.get("/posts/saved");
      setSavedPosts((res.data.posts || []).sort(
        (a: Post, b: Post) => b.unix_timestamp - a.unix_timestamp
      ));
    } catch (e) {
      console.error("Error fetching saved posts:", e);
    }
  }, []);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await api.get("/posts/drafts");
      setDrafts((res.data.drafts || []).sort(
        (a: Post, b: Post) => b.unix_timestamp - a.unix_timestamp
      ));
    } catch (e) {
      console.error("Error fetching drafts:", e);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchProfile();
      void fetchSaved();
      void fetchDrafts();
    }
  }, [token, fetchProfile, fetchSaved, fetchDrafts]);

  const publishDraft = async (postId: number) => {
    if (!token) return;
    try {
      await api.post(`/posts/drafts/publish/${postId}`, {});
      void fetchProfile();
      void fetchDrafts();
    } catch (e) {
      console.error("Error publishing draft:", e);
    }
  };

  const handleBioUpdate = async () => {
    if (!token) return;
    try {
      await api.put("/profile/me", { bio });
      void fetchProfile();
    } catch (e) {
      console.error("Error updating bio:", e);
    }
  };

  const handleImageUpload = async () => {
    if (!token || !selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      await api.post("/profile/me/upload-profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      void fetchProfile();
    } catch (e) {
      console.error("Image upload failed:", e);
    }
  };

  // ── Post interaction handlers ──────────────────────────────────────────
  // usePostActions expects a setter shaped like `(prev => next) => void`. We
  // fan it out to both `profile.posts` and `savedPosts` so a reaction on either
  // tab updates the counts everywhere the post appears.
  const setPosts = useCallback((fn: (prev: Post[]) => Post[]) => {
    setProfile((prev) => (prev ? { ...prev, posts: fn(prev.posts) } : prev));
    setSavedPosts(fn);
  }, []);

  const actions = usePostInteractions(setPosts);
  const { replyProps } = useReplies();

  if (!token) {
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <p>Please <a href="/login">log in</a> to view your profile.</p>
      </div>
    );
  }

  const renderPostList = (posts: Post[], emptyMessage: string) => (
    posts.length > 0 ? (
      posts.map((post, index) => (
        <PostCard key={post.id || index} post={post} index={index} {...actions} {...replyProps} />
      ))
    ) : (
      <p>{emptyMessage}</p>
    )
  );

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <FloatingButtons />
      <h2>Your Profile</h2>

      <ProfileHeader
        profile={profile}
        bio={bio}
        onBioChange={setBio}
        onBioUpdate={handleBioUpdate}
        onFileSelect={setSelectedFile}
        onImageUpload={handleImageUpload}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: 8, background: activeTab === tab ? "#ddd" : "#fff",
              border: "1px solid #ccc", color: activeTab === tab ? "#000" : "#333", cursor: "pointer",
              textTransform: "capitalize" }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "posts" && (
        <>
          <h3>Your Posts</h3>
          {renderPostList(profile?.posts ?? [], "No posts yet.")}
        </>
      )}

      {activeTab === "saved" && (
        <>
          <h3>Saved</h3>
          {renderPostList(savedPosts, "No saved posts yet.")}
        </>
      )}

      {activeTab === "drafts" && (
        <>
          <h3>Drafts</h3>
          <DraftList drafts={drafts} onPublish={publishDraft} />
        </>
      )}
    </div>
  );
}
