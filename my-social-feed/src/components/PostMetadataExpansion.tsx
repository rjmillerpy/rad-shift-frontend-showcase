"use client";
import React from "react";
import type { PostMetadata } from "@/types/post";

type Props = {
  metadata: PostMetadata;
};

export function hasExpandableMetadata(metadata: PostMetadata | undefined): boolean {
  if (!metadata) return false;
  return Boolean(
    metadata.tags?.length ||
      metadata.tagged_users?.length ||
      metadata.location,
  );
}

export default function PostMetadataExpansion({ metadata }: Props) {
  const tags = metadata.tags;
  const tagged = metadata.tagged_users;
  const location = metadata.location;

  return (
    <div style={{ fontSize: "12px", color: "#555", marginTop: "5px" }}>
      {tags && (
        <div>
          <strong>Tags:</strong>{" "}
          {Array.isArray(tags) ? tags.join(", ") : tags}
        </div>
      )}
      {(tagged?.length ?? 0) > 0 && (
        <div>
          <strong>Tagged:</strong> {tagged!.join(", ")}
        </div>
      )}
      {location && (
        <div>
          <strong>Location:</strong> {location}
        </div>
      )}
    </div>
  );
}
