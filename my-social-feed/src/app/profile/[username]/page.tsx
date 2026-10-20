"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import FloatingButtons from "@/components/FloatingButtons";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import { useReplies } from "@/hooks/useReplies";
import type { Post } from "@/types/post";
import type { Profile } from "@/types/profile";

export default function UserProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (user: string) => {
    try {
      const res = await api.get(`/profile/${user}`);
      const sortedPosts = [...(res.data.posts || [])].sort(
        (a: Post, b: Post) => b.unix_timestamp - a.unix_timestamp
      );
      setProfile({ ...res.data, posts: sortedPosts });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  useEffect(() => {
    if (username) void fetchProfile(username as string);
  }, [username, fetchProfile]);

  // ── Interaction handlers ───────────────────────────────────────────────
  const setPosts = useCallback((fn: (prev: Post[]) => Post[]) => {
    setProfile((prev) => (prev ? { ...prev, posts: fn(prev.posts) } : prev));
  }, []);
  const actions = usePostInteractions(setPosts);
  const { replyProps } = useReplies();

  if (!profile) {
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <FloatingButtons />
      <h2>{profile.username}&apos;s Profile</h2>

      {profile.profile_picture_url && (
        <div style={{ marginBottom: "20px" }}>
          <img src={profile.profile_picture_url} alt="Profile"
            style={{ width: "150px", height: "150px", objectFit: "cover",
              clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)" }} />
        </div>
      )}

      <p><strong>Bio:</strong> {profile.bio || "No bio available."}</p>

      <h3>{profile.username}&apos;s Posts</h3>
      {profile.posts?.length > 0 ? (
        profile.posts.map((post: Post, index: number) => (
          <PostCard key={post.id || index} post={post} index={index} {...actions} {...replyProps} />
        ))
      ) : (
        <p>No posts yet.</p>
      )}
    </div>
  );
}
