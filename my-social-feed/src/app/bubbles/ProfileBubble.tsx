"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { HEX_AVATAR_CLIP, PROFILE_BUBBLE_SIZE } from "./constants";
import type { ProfileBubbleState } from "./types";

// Size of the small profile-bubble variant shown while the user is in a
// drilled-in constellation. Smaller than the overview drifter so it doesn't
// compete with the orbit for attention.
const ZOOMED_PROFILE_BUBBLE_SIZE = 60;
const ZOOMED_PROFILE_INNER_SIZE = 54;

type FloatingProps = {
  profilePic: string | null;
  bubble: ProfileBubbleState;
};

/** The user's profile avatar rendered as a small floating hex that drifts
    around the overview alongside the topic bubbles. Clicking navigates to
    /profile. */
export function FloatingProfileBubble({ profilePic, bubble }: FloatingProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/profile")}
      title="Your profile"
      style={{
        position: "absolute",
        left: bubble.x - PROFILE_BUBBLE_SIZE / 2,
        top: bubble.y - PROFILE_BUBBLE_SIZE / 2,
        width: PROFILE_BUBBLE_SIZE,
        height: PROFILE_BUBBLE_SIZE,
        border: "none",
        cursor: "pointer",
        background: "transparent",
        padding: 0,
        zIndex: 15,
        transition: "transform 0.15s ease-in-out",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.15)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      <div style={{
        width: PROFILE_BUBBLE_SIZE, height: PROFILE_BUBBLE_SIZE, background: "#fff",
        clipPath: HEX_AVATAR_CLIP, WebkitClipPath: HEX_AVATAR_CLIP,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4))",
      }}>
        <img
          src={proxyIfNeeded(profilePic || DEFAULT_AVATAR)}
          crossOrigin="anonymous"
          alt="Your profile"
          style={{
            width: PROFILE_BUBBLE_SIZE - 6, height: PROFILE_BUBBLE_SIZE - 6, objectFit: "cover",
            clipPath: HEX_AVATAR_CLIP, WebkitClipPath: HEX_AVATAR_CLIP,
          }}
        />
      </div>
    </button>
  );
}

type PinnedProps = {
  profilePic: string | null;
};

/** Small static profile hex pinned to the bottom-left corner while the user
    is in a drilled-in constellation. Clicking navigates to /profile. */
export function PinnedProfileBubble({ profilePic }: PinnedProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/profile")}
      title="Your profile"
      data-testid="zoomed-profile-bubble"
      style={{
        position: "absolute",
        left: 20, bottom: 20,
        width: ZOOMED_PROFILE_BUBBLE_SIZE,
        height: ZOOMED_PROFILE_BUBBLE_SIZE,
        border: "none",
        cursor: "pointer",
        background: "transparent",
        padding: 0,
        zIndex: 15,
        transition: "transform 0.15s ease-in-out",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.15)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      <div style={{
        width: ZOOMED_PROFILE_BUBBLE_SIZE, height: ZOOMED_PROFILE_BUBBLE_SIZE, background: "#fff",
        clipPath: HEX_AVATAR_CLIP,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
      }}>
        <img
          src={proxyIfNeeded(profilePic || DEFAULT_AVATAR)}
          crossOrigin="anonymous"
          alt="Your profile"
          style={{
            width: ZOOMED_PROFILE_INNER_SIZE, height: ZOOMED_PROFILE_INNER_SIZE, objectFit: "cover",
            clipPath: HEX_AVATAR_CLIP,
          }}
        />
      </div>
    </button>
  );
}
