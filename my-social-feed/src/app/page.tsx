"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEEDS = [
  {
    key: "bubbles",
    name: "Bubbles",
    path: "/bubbles",
    description: "Floating topic bubbles you can explore by clicking into constellations. Calming, visual, non-linear.",
    color: "#1a1a2e",
    accent: "#007bff",
    emoji: "🫧",
  },
  {
    key: "chronicle",
    name: "Chronicle",
    path: "/chronicle",
    description: "Your feed narrated as a story. Posts woven into prose you read like a book, page by page.",
    color: "#2c1810",
    accent: "#d4a017",
    emoji: "📖",
  },
  {
    key: "agora",
    name: "Agora",
    path: "/agora",
    description: "Classic forum-style feed. Numbered posts, threaded replies, old-school internet vibes.",
    color: "#1a4035",
    accent: "#8faa70",
    emoji: "🏛️",
  },
  {
    key: "mosaic",
    name: "Mosaic",
    path: "/mosaic",
    description: "A visual moodboard of posts as tiles. Hover to peek, click to read. See everything at once.",
    color: "#111111",
    accent: "#e74c3c",
    emoji: "🧩",
  },
  {
    key: "ledger",
    name: "Ledger",
    path: "/ledger",
    description: "Your feed disguised as a spreadsheet. Rows, columns, formula bar — perfect when the boss walks by.",
    color: "#0d3d24",
    accent: "#217346",
    emoji: "📊",
  },
  {
    key: "amble",
    name: "Amble",
    path: "/amble",
    description: "Wander a top-down town and bump into content by exploring — signs, buildings, and residents surface posts you didn't expect.",
    color: "#2d3d24",
    accent: "#8fbc8f",
    emoji: "🌳",
  },
];

export default function FeedChooserPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [hoveredFeed, setHoveredFeed] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    setToken(stored);

    // If user has a remembered choice, redirect immediately
    const savedFeed = localStorage.getItem("preferred_feed");
    if (savedFeed && stored) {
      const feed = FEEDS.find((f) => f.key === savedFeed);
      if (feed) {
        router.replace(feed.path);
        return;
      }
    }
  }, [router]);

  const handleChoose = (feed: typeof FEEDS[number]) => {
    if (remember) {
      localStorage.setItem("preferred_feed", feed.key);
    }

    if (!token) {
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent(feed.path)}`);
      return;
    }

    router.push(feed.path);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{
          fontSize: "42px",
          color: "#fff",
          margin: "0 0 8px 0",
          fontWeight: "bold",
          letterSpacing: "2px",
        }}>
          RadShift
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#8899aa",
          margin: 0,
          fontStyle: "italic",
        }}>
          Choose your experience
        </p>
      </div>

      {/* Feed cards */}
      <div style={{
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "1000px",
      }}>
        {FEEDS.map((feed) => (
          <button
            key={feed.key}
            data-testid={`feed-${feed.key}`}
            onClick={() => handleChoose(feed)}
            onMouseEnter={() => setHoveredFeed(feed.key)}
            onMouseLeave={() => setHoveredFeed(null)}
            style={{
              width: "280px",
              padding: "0",
              border: hoveredFeed === feed.key ? `2px solid ${feed.accent}` : "2px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              background: feed.color,
              transition: "all 0.3s ease",
              transform: hoveredFeed === feed.key ? "translateY(-8px)" : "none",
              boxShadow: hoveredFeed === feed.key
                ? `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${feed.accent}33`
                : "0 8px 24px rgba(0,0,0,0.3)",
              textAlign: "left",
            }}
          >
            {/* Preview area */}
            <div style={{
              height: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
              background: `linear-gradient(180deg, ${feed.color} 0%, ${feed.accent}22 100%)`,
            }}>
              {feed.emoji}
            </div>

            {/* Info */}
            <div style={{ padding: "20px" }}>
              <h2 style={{
                fontSize: "22px",
                color: "#fff",
                margin: "0 0 8px 0",
                fontWeight: "bold",
              }}>
                {feed.name}
              </h2>
              <p style={{
                fontSize: "13px",
                color: "#aaa",
                margin: 0,
                lineHeight: 1.5,
              }}>
                {feed.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Remember choice */}
      <label style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "32px",
        color: "#8899aa",
        fontSize: "14px",
        cursor: "pointer",
      }}>
        <input
          data-testid="remember-choice"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          style={{ accentColor: "#007bff" }}
        />
        Remember my choice
      </label>

      {/* Footer links */}
      <div style={{
        marginTop: "32px",
        display: "flex",
        gap: "20px",
        fontSize: "13px",
      }}>
        {token ? (
          <>
            <Link href="/profile" style={{ color: "#667788", textDecoration: "none" }}>Profile</Link>
            <Link href="/blog" style={{ color: "#667788", textDecoration: "none" }}>Blog</Link>
            <Link href="/search" style={{ color: "#667788", textDecoration: "none" }}>Search</Link>
            <Link href="/lame" style={{ color: "#556677", textDecoration: "none" }}>Classic Feed</Link>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: "#667788", textDecoration: "none" }}>Log In</Link>
            <Link href="/signup" style={{ color: "#667788", textDecoration: "none" }}>Sign Up</Link>
          </>
        )}
      </div>
    </div>
  );
}
