import React from "react";
import { render, screen } from "@testing-library/react";
import PostMetadataExpansion, {
  hasExpandableMetadata,
} from "@/components/PostMetadataExpansion";
import type { PostMetadata } from "@/types/post";

describe("hasExpandableMetadata", () => {
  test.each<{ desc: string; meta: PostMetadata | undefined; expected: boolean }>([
    { desc: "undefined", meta: undefined, expected: false },
    { desc: "empty object", meta: {}, expected: false },
    { desc: "tags array", meta: { tags: ["t1"] }, expected: true },
    { desc: "empty tags array", meta: { tags: [] }, expected: false },
    { desc: "tagged_users", meta: { tagged_users: ["alice"] }, expected: true },
    { desc: "location", meta: { location: "Portland" }, expected: true },
    { desc: "only source/link_card", meta: { source: { platform: "reddit", name: "x", label: "Reddit · x" } }, expected: false },
  ])("returns $expected for $desc", ({ meta, expected }) => {
    expect(hasExpandableMetadata(meta)).toBe(expected);
  });
});

describe("PostMetadataExpansion", () => {
  it("renders tags when present", () => {
    render(<PostMetadataExpansion metadata={{ tags: ["python", "web"] }} />);
    expect(screen.getByText("Tags:")).toBeInTheDocument();
    expect(screen.getByText(/python, web/)).toBeInTheDocument();
  });

  it("renders tagged_users when present", () => {
    render(<PostMetadataExpansion metadata={{ tagged_users: ["alice", "bob"] }} />);
    expect(screen.getByText("Tagged:")).toBeInTheDocument();
    expect(screen.getByText(/alice, bob/)).toBeInTheDocument();
  });

  it("renders location when present", () => {
    render(<PostMetadataExpansion metadata={{ location: "Portland" }} />);
    expect(screen.getByText("Location:")).toBeInTheDocument();
    expect(screen.getByText("Portland")).toBeInTheDocument();
  });

  it("ignores source/link_card fields (they have their own components)", () => {
    render(
      <PostMetadataExpansion
        metadata={{
          source: { platform: "reddit", name: "r/x", label: "Reddit · r/x" },
          link_card: { url: "https://x.com" },
        }}
      />
    );
    expect(screen.queryByText("Source:")).not.toBeInTheDocument();
    expect(screen.queryByText("Reddit")).not.toBeInTheDocument();
  });
});
