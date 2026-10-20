"use client";
import React from "react";
import type { Profile } from "@/types/profile";

// Hex-shaped avatar clip used across the profile pages.
const HEX_CLIP = "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)";

type Props = {
  profile: Profile | null;
  bio: string;
  onBioChange: (value: string) => void;
  onBioUpdate: () => void;
  onFileSelect: (file: File | null) => void;
  onImageUpload: () => void;
};

export default function ProfileHeader({
  profile, bio, onBioChange, onBioUpdate, onFileSelect, onImageUpload,
}: Props) {
  return (
    <>
      {profile?.profile_picture_url && (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={profile.profile_picture_url}
            alt="Profile"
            style={{
              width: "150px", height: "150px", objectFit: "cover", clipPath: HEX_CLIP,
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <label>
          Upload New Profile Picture:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          />
        </label>
        <button onClick={onImageUpload} style={{ marginLeft: "10px" }}>Upload</button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Bio:
          <textarea
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            style={{ width: "100%", height: "80px", marginTop: "5px", padding: "10px" }}
          />
        </label>
        <button onClick={onBioUpdate} style={{ marginTop: "10px" }}>Update Bio</button>
      </div>
    </>
  );
}
