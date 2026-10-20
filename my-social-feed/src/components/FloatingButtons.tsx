"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ComposerModal from "@/components/ComposerModal";
import { NewPostFab, SearchFab } from "@/components/Fabs";
import api from "@/lib/api";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type FloatingButtonsProps = {
  hideComposer?: boolean;
  hideProfilePic?: boolean;
  feedSettingsPath?: string;
};

export default function FloatingButtons({ hideComposer = false, hideProfilePic = false, feedSettingsPath }: FloatingButtonsProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const closeComposer = useCallback(() => setComposerOpen(false), []);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    // async/await tolerates api.get being stubbed with a jest.fn() that
    // returns undefined; a raw `.then()` chain would throw synchronously.
    void (async () => {
      try {
        const res = await api.get("/profile/me");
        if (res?.data?.profile_picture_url) setProfilePic(res.data.profile_picture_url);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      }
    })();
  }, [token]);

  return (
    <>
      {/* Corner: profile pic or login link */}
      {!hideProfilePic && token ? (
        <img
          src={proxyIfNeeded(profilePic || DEFAULT_AVATAR)}
          crossOrigin="anonymous"
          alt="Your profile"
          onClick={() => router.push("/profile")}
          style={{
            width: "40px",
            height: "40px",
            objectFit: "cover",
            position: "fixed",
            top: "20px",
            right: "20px",
            cursor: "pointer",
            zIndex: 1001,
            clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            WebkitClipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
          }}
        />
      ) : !hideProfilePic ? (
        <Link
          href="/login"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            color: "#007bff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "bold",
            zIndex: 1001,
          }}
        >
          Log in
        </Link>
      ) : null}

      <SearchFab bottom="30px" />
      {token && !hideComposer && <NewPostFab bottom="100px" onClick={() => setComposerOpen(true)} />}

      {/* Settings gear button (right side, top of stack) */}
      {token && (
        <div style={{ position: "fixed", bottom: !hideComposer ? "170px" : "100px", right: "30px", zIndex: 1000 }}>
          {settingsExpanded && (
            <div style={{
              position: "absolute", bottom: "4px", right: "64px",
              display: "flex", flexDirection: "row-reverse", gap: "8px",
              alignItems: "center",
            }}>
              <button
                onClick={() => { router.push("/settings/algo"); setSettingsExpanded(false); }}
                title="Algorithm Settings"
                aria-label="Algorithm Settings"
                data-testid="settings-algo-btn"
                style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  backgroundColor: "#28a745", color: "#fff", border: "none",
                  fontSize: "18px", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                📊
              </button>
              {feedSettingsPath && (
                <button
                  onClick={() => { router.push(feedSettingsPath); setSettingsExpanded(false); }}
                  title="Feed Settings"
                  aria-label="Feed Settings"
                  data-testid="settings-feed-btn"
                  style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    backgroundColor: "#6f42c1", color: "#fff", border: "none",
                    fontSize: "18px", cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  🎨
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setSettingsExpanded((p) => !p)}
            title="Settings"
            aria-label="Settings"
            data-testid="settings-gear-btn"
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              backgroundColor: settingsExpanded ? "#555" : "#fff",
              color: settingsExpanded ? "#fff" : "#333",
              border: "1px solid #ccc",
              fontSize: "24px", cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s ease-in-out",
              transform: settingsExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ⚙️
          </button>
        </div>
      )}

      {/* Composer Modal */}
      {composerOpen && token && (
        <ComposerModal
          token={token}
          quotePreview={null}
          quotePostId={null}
          onClearQuote={() => {}}
          onPostCreated={() => {
            setComposerOpen(false);
            window.location.reload();
          }}
          onClose={closeComposer}
        />
      )}
    </>
  );
}
