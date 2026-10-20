/**
 * Tests for src/app/trends/TrendSourceCard.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";

import TrendSourceCard from "@/app/trends/TrendSourceCard";
import type { SourceTrends } from "@/types/trends";


const _bundle = (overrides: Partial<SourceTrends> = {}): SourceTrends => ({
  source: "google",
  label: "Google Search",
  items: [
    { source: "google", rank: 1, keyword: "foo", url: null, volume: "10K+", category: null },
    { source: "google", rank: 2, keyword: "bar", url: "https://example.com", volume: null, category: null },
  ],
  fetched_at: Math.floor(Date.now() / 1000),
  error: null,
  ...overrides,
});


describe("TrendSourceCard", () => {
  test("renders label and all items", () => {
    render(<TrendSourceCard bundle={_bundle()} />);
    expect(screen.getByText("Google Search")).toBeInTheDocument();
    expect(screen.getByText("foo")).toBeInTheDocument();
    expect(screen.getByText("bar")).toBeInTheDocument();
    expect(screen.getByText("10K+")).toBeInTheDocument();
  });

  test("renders error message and no items when bundle has an error", () => {
    render(
      <TrendSourceCard bundle={_bundle({ items: [], error: "timed out" })} />,
    );
    expect(screen.getByText("timed out")).toBeInTheDocument();
    expect(screen.queryByText("foo")).not.toBeInTheDocument();
  });

  test("renders 'no trends' when items are empty and no error", () => {
    render(<TrendSourceCard bundle={_bundle({ items: [], error: null })} />);
    expect(screen.getByText(/no trends available/i)).toBeInTheDocument();
  });

  test("item with URL is an external link", () => {
    render(<TrendSourceCard bundle={_bundle()} />);
    const link = screen.getByText("bar").closest("a");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  test("item without URL does not wrap in an anchor", () => {
    render(<TrendSourceCard bundle={_bundle()} />);
    expect(screen.getByText("foo").closest("a")).toBeNull();
  });
});
