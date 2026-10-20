/**
 * Tests for /trends page.
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

import TrendsPage from "@/app/trends/page";

const _bundle = (source: string, label: string, items: Array<{ rank: number; keyword: string; volume?: string | null; url?: string | null }>) => ({
  source,
  label,
  items: items.map((i) => ({
    source,
    rank: i.rank,
    keyword: i.keyword,
    url: i.url ?? null,
    volume: i.volume ?? null,
    category: null,
  })),
  fetched_at: Math.floor(Date.now() / 1000),
  error: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());


describe("TrendsPage", () => {
  test("renders trend keywords from multiple sources", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        sources: [
          _bundle("google", "Google Search", [{ rank: 1, keyword: "elden ring dlc" }]),
          _bundle("reddit", "Reddit Popular", [{ rank: 1, keyword: "that cat is huge" }]),
        ],
      },
    });

    render(<TrendsPage />);

    await waitFor(() => expect(screen.getByText("elden ring dlc")).toBeInTheDocument());
    expect(screen.getByText("that cat is huge")).toBeInTheDocument();
    expect(screen.getByText("Google Search")).toBeInTheDocument();
  });

  test("shows per-source error message when a fetch fails", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        sources: [
          { source: "google", label: "Google Search", items: [], fetched_at: 1, error: "timed out" },
        ],
      },
    });

    render(<TrendsPage />);

    await waitFor(() => expect(screen.getByText("timed out")).toBeInTheDocument());
  });

  test("refresh button calls /trends/refresh", async () => {
    mockedAxios.get.mockResolvedValue({ data: { sources: [_bundle("google", "Google Search", [{ rank: 1, keyword: "a" }])] } });
    mockedAxios.post.mockResolvedValue({ data: { sources: [_bundle("google", "Google Search", [{ rank: 1, keyword: "b" }])] } });

    render(<TrendsPage />);
    await waitFor(() => expect(screen.getByText("a")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1));
    expect(mockedAxios.post.mock.calls[0][0]).toMatch(/\/trends\/refresh$/);
    await waitFor(() => expect(screen.getByText("b")).toBeInTheDocument());
  });

  test("shows load error banner when the initial request fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("net down"));

    render(<TrendsPage />);

    await waitFor(() => expect(screen.getByText(/failed to load trends/i)).toBeInTheDocument());
  });

  test("items with URLs render as external links", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        sources: [
          _bundle("trends24", "X (via trends24)", [
            { rank: 1, keyword: "#linked", url: "https://twitter.com/search?q=linked" },
          ]),
        ],
      },
    });

    render(<TrendsPage />);
    await waitFor(() => expect(screen.getByText("#linked")).toBeInTheDocument());
    const link = screen.getByText("#linked").closest("a");
    expect(link).toHaveAttribute("href", "https://twitter.com/search?q=linked");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
