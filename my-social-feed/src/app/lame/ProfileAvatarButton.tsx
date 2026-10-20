"use client";
import { DEFAULT_AVATAR } from "@/lib/config";
import { proxyIfNeeded } from "@/lib/utils";
import { HEX_AVATAR_CLIP } from "./constants";

type ProfileAvatarButtonProps = {
  /** The user's picture, or null to show the default avatar. */
  profilePic: string | null;
  onClick: () => void;
};

/** The hexagonal avatar pinned to the top-right of the feed; opens the profile. */
export default function ProfileAvatarButton({ profilePic, onClick }: ProfileAvatarButtonProps) {
  return (
    <img
      src={proxyIfNeeded(profilePic || DEFAULT_AVATAR)}
      crossOrigin="anonymous"
      alt="Profile"
      onClick={onClick}
      style={{
        width: "40px",
        height: "40px",
        objectFit: "cover",
        position: "absolute",
        top: "20px",
        right: "20px",
        cursor: "pointer",
        zIndex: 999,
        clipPath: HEX_AVATAR_CLIP,
        WebkitClipPath: HEX_AVATAR_CLIP,
      }}
    />
  );
}
