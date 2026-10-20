"use client";
import { Suspense, useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import FloatingButtons from "@/components/FloatingButtons";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { normalizePost } from "@/lib/postUtils";
import { PAGE_SIZE } from "@/lib/constants";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import { useReplies } from "@/hooks/useReplies";
import type { Post } from "@/types/post";

const BIO_PREVIEW_CHARS = 100;

interface UserResult {
  username: string;
  bio?: string | null;
  profile_picture_url?: string | null;
}

// Shape returned by the /posts/search/posts endpoint. `is_me` is added on
// top of the standard Post payload so the caller can hide "report" affordances
// for their own posts.
type PostSearchResult = Post & { is_me?: boolean };

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
    if (query) {
      if (activeTab === "posts") void searchPosts(query, false);
      else void searchUsers(query, false);
    } else {
      setPosts([]);
      setUsers([]);
      setLoading(false);
    }
  }, [query, activeTab]);

  const searchPosts = async (q: string, append: boolean, offset = 0) => {
    try {
      setLoading(true);
      const res = await api.get("/posts/search/posts", {
        params: { q, offset, limit: PAGE_SIZE },
      });
      const processed: PostSearchResult[] = res.data.posts.map((p: PostSearchResult) => ({
        ...normalizePost(p),
        is_me: p.is_me ?? false,
      }));
      if (append) {
        setPosts((prev) => [...prev, ...processed]);
      } else {
        setPosts(processed);
      }
      setHasMorePosts(res.data.has_more ?? false);
    } catch (e) {
      console.error("Error searching posts:", e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (q: string, append: boolean, offset = 0) => {
    try {
      const res = await api.get("/posts/search/users", {
        params: { q, offset, limit: PAGE_SIZE },
      });
      if (append) {
        setUsers((prev) => [...prev, ...res.data.users]);
      } else {
        setUsers(res.data.users);
      }
      setHasMoreUsers(res.data.has_more ?? false);
    } catch (e) {
      console.error("Error searching users:", e);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      // Client-side nav so we stay in the SPA (rule 66).
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  // ── Interaction handlers ───────────────────────────────────────────────
  const actions = usePostInteractions(setPosts);
  const { replyProps } = useReplies();

  return (
    <div style={{ padding: "30px", maxWidth: "700px", margin: "auto" }}>
      <FloatingButtons hideComposer />

      <Link href="/" style={{ color: "#007bff", textDecoration: "none", fontSize: "14px" }}>
        &larr; Back to feed
      </Link>

      <form onSubmit={handleSearch} style={{ marginTop: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts and users..."
            style={{ flex: 1, padding: "10px 14px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "8px" }} />
          <button type="submit"
            style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" }}>
            Search
          </button>
        </div>
      </form>

      {query && (
        <>
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Results for &ldquo;{query}&rdquo;
          </h2>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button onClick={() => {
                setActiveTab("posts");
                if (query && posts.length === 0) void searchPosts(query, false);
              }}
              style={{ padding: "8px 16px", backgroundColor: activeTab === "posts" ? "#ccc" : "#fff",
                border: "1px solid #ccc", color: activeTab === "posts" ? "#000" : "#333", cursor: "pointer", borderRadius: "4px" }}>
              Posts ({posts.length}{hasMorePosts ? "+" : ""})
            </button>
            <button onClick={() => {
                setActiveTab("users");
                if (query && users.length === 0) void searchUsers(query, false);
              }}
              style={{ padding: "8px 16px", backgroundColor: activeTab === "users" ? "#ccc" : "#fff",
                border: "1px solid #ccc", color: activeTab === "users" ? "#000" : "#333", cursor: "pointer", borderRadius: "4px" }}>
              Users ({users.length}{hasMoreUsers ? "+" : ""})
            </button>
          </div>

          {loading && <p>Searching...</p>}

          {/* Posts tab */}
          {activeTab === "posts" && !loading && (
            <div>
              {posts.length === 0 ? (
                <p style={{ color: "#666" }}>No posts found.</p>
              ) : (
                posts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} {...actions} {...replyProps} />
                ))
              )}
              {hasMorePosts && (
                <div style={{ textAlign: "center", margin: "16px 0" }}>
                  <button onClick={() => searchPosts(query, true, posts.length)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: "8px" }}>
                    <img src="/paginate.png" alt="Load more" width={56} height={56} style={{ borderRadius: "50%" }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Users tab */}
          {activeTab === "users" && !loading && (
            <div>
              {users.length === 0 ? (
                <p style={{ color: "#666" }}>No users found.</p>
              ) : (
                users.map((user) => (
                  <Link key={user.username} href={`/profile/${user.username}`}
                    style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ padding: "12px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                      <img src={proxyIfNeeded(user.profile_picture_url || DEFAULT_AVATAR)} alt="Avatar"
                        style={{ width: "48px", height: "48px", objectFit: "cover",
                          clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)" }} />
                      <div>
                        <div style={{ fontWeight: "bold" }}>@{user.username}</div>
                        {user.bio && (
                          <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                            {user.bio.length > BIO_PREVIEW_CHARS ? user.bio.slice(0, BIO_PREVIEW_CHARS) + "\u2026" : user.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
              {hasMoreUsers && (
                <div style={{ textAlign: "center", margin: "16px 0" }}>
                  <button onClick={() => searchUsers(query, true, users.length)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: "8px" }}>
                    <img src="/paginate.png" alt="Load more" width={56} height={56} style={{ borderRadius: "50%" }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// useSearchParams must sit inside a Suspense boundary for Next to prerender
// the page shell.
export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
