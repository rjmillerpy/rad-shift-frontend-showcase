"use client";
import { useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { API_URL } from "@/lib/config";
import type { ChapterData, Segment } from "./types";
import {
  FALLBACK_TIMEOUT_MS,
  POSTS_PER_PAGE_FALLBACK,
  POSTS_PER_PAGE_STREAM,
} from "./types";

// Shape of the server-sent event payloads emitted by /posts/chronicle/stream.
type StreamMessage =
  | { type: "init"; page?: number; posts?: unknown[]; has_more?: boolean }
  | { type: "token" }
  | { type: "segment"; segment: Segment }
  | { type: "done"; segments?: Segment[]; cached?: boolean };

type State = {
  chapters: ChapterData[];
  loading: boolean;
  generating: boolean;
};

/**
 * Streams the chronicle chapter for `page` via SSE. Falls back to a plain
 * `api.get` when the EventSource errors so slow or proxy-broken connections
 * still produce a readable chapter.
 *
 * The hook is intentionally imperative (returns a `fetchChapter` function) —
 * fetching is triggered by title submission, prev/next navigation, and refresh,
 * not by a change in props, so a useEffect-driven fetcher would be awkward.
 */
export function useChronicleStream(token: string | null) {
  const [chapters, setChaptersState] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const applyMessage = useCallback((msg: StreamMessage, page: number) => {
    if (msg.type === "init") {
      setLoading(false);
      setGenerating(true);
      setChaptersState((prev) => {
        const u = [...prev];
        const idx = msg.page ?? page;
        u[idx] = {
          segments: [],
          posts: (msg.posts as ChapterData["posts"]) || [],
          page: idx,
          has_more: msg.has_more ?? false,
          cached: false,
        };
        return u;
      });
    } else if (msg.type === "segment") {
      setChaptersState((prev) => {
        const u = [...prev];
        const ch = u[page];
        if (ch) u[page] = { ...ch, segments: [...ch.segments, msg.segment] };
        return u;
      });
    } else if (msg.type === "done") {
      setGenerating(false);
      const segments = msg.segments || [];
      setChaptersState((prev) => {
        const u = [...prev];
        const ch = u[page];
        u[page] = {
          segments,
          posts: ch?.posts || [],
          page,
          has_more: ch?.has_more ?? false,
          cached: !!msg.cached,
        };
        return u;
      });
      closeStream();
    }
    // msg.type === "token" is intentionally ignored — the tokens are raw JSON
    // partials that would render noise; we wait for parsed "segment" events.
  }, [closeStream]);

  const fetchChapter = useCallback((page: number) => {
    setLoading(true);
    setGenerating(false);
    closeStream();

    const params = new URLSearchParams({
      page: String(page),
      posts_per_page: String(POSTS_PER_PAGE_STREAM),
    });
    if (token) params.set("token", token);

    const es = new EventSource(`${API_URL}/posts/chronicle/stream?${params}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const msg: StreamMessage = JSON.parse(event.data);
        applyMessage(msg, page);
      } catch (e) {
        console.error("Failed to parse chronicle event:", e);
      }
    };

    es.onerror = () => {
      closeStream();
      setGenerating(false);
      // Fallback: request the whole chapter non-streaming. The endpoint runs
      // the LLM to completion server-side; we allow up to FALLBACK_TIMEOUT_MS.
      api.get("/posts/chronicle", {
        params: { page, posts_per_page: POSTS_PER_PAGE_FALLBACK },
        timeout: FALLBACK_TIMEOUT_MS,
      }).then((res) => {
        setChaptersState((prev) => { const u = [...prev]; u[page] = res.data; return u; });
      }).catch((e) => {
        console.error("Chronicle fetch failed:", e);
      }).finally(() => {
        setLoading(false);
      });
    };
  }, [token, closeStream, applyMessage]);

  const state: State = { chapters, loading, generating };
  return { ...state, setChapters: setChaptersState, fetchChapter, closeStream };
}
