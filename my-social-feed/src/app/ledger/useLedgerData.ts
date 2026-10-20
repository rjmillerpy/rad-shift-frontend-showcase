"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import type { Post } from "@/types/post";
import type { LedgerRow, MediaKind, SheetKey, SortKey, TypeFilter } from "./types";
import {
  CELL_TEXT_MAX_CHARS,
  LEDGER_INITIAL_VISIBLE,
  LEDGER_PAGE_SIZE,
  LEDGER_LOAD_MORE_STEP,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SHEETS,
} from "./constants";
import { sanitize } from "./sfwFilter";

type Options = {
  sheet: SheetKey;
  sort: SortKey;
  typeFilter: TypeFilter;
  search: string;
  token: string | null;
};

/** Return the classification icon for a post's attached media. */
export function classifyMedia(post: Post): MediaKind {
  if (post.video_url) return "video";
  if (post.image_url) return "image";
  if (post.audio_url) return "audio";
  return "text";
}

/** Format a unix timestamp as "Nx ago" for the "When" column. */
export function formatRelativeTime(unixSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const delta = Math.max(0, now - unixSeconds);
  if (delta < SECONDS_PER_MINUTE) return "just now";
  if (delta < SECONDS_PER_HOUR) return `${Math.floor(delta / SECONDS_PER_MINUTE)}m ago`;
  if (delta < SECONDS_PER_DAY) return `${Math.floor(delta / SECONDS_PER_HOUR)}h ago`;
  return `${Math.floor(delta / SECONDS_PER_DAY)}d ago`;
}

/** Truncate `s` with an ellipsis if it exceeds `max` characters. */
export function truncateForCell(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/** Build a LedgerRow value object from a raw Post. Kept pure so it's easy
    to test in isolation (rule 54). Runs the username + text through the SFW
    filter so downstream consumers never see the original profanity. */
export function buildLedgerRow(post: Post): LedgerRow {
  const rawName = sanitize(post.username ?? "");
  const rawText = sanitize(post.text ?? "");
  return {
    post,
    rawName,
    rawText,
    displayName: truncateForCell(rawName, CELL_TEXT_MAX_CHARS.A),
    displayText: truncateForCell(rawText, CELL_TEXT_MAX_CHARS.B),
    displayLikes: post.likes ?? 0,
    displayReposts: post.reposts ?? 0,
    mediaKind: classifyMedia(post),
    displayWhen: formatRelativeTime(post.unix_timestamp ?? 0),
  };
}

const SORTERS: Record<SortKey, (a: Post, b: Post) => number> = {
  recent: (a, b) => (b.unix_timestamp ?? 0) - (a.unix_timestamp ?? 0),
  oldest: (a, b) => (a.unix_timestamp ?? 0) - (b.unix_timestamp ?? 0),
  likes: (a, b) => (b.likes ?? 0) - (a.likes ?? 0),
  reposts: (a, b) => (b.reposts ?? 0) - (a.reposts ?? 0),
};

/** Client-side filter: type + full-text search over username and post text. */
export function applyClientFilters(
  posts: Post[], typeFilter: TypeFilter, search: string,
): Post[] {
  const needle = search.trim().toLowerCase();
  return posts.filter((p) => {
    if (typeFilter !== "all" && classifyMedia(p) !== typeFilter) return false;
    if (needle === "") return true;
    return (p.username ?? "").toLowerCase().includes(needle)
      || (p.text ?? "").toLowerCase().includes(needle);
  });
}

/**
 * Fetches posts for the currently-active sheet, applies client-side
 * filtering + sorting + truncation, and returns typed rows for the grid.
 * Sheets that require auth resolve to an empty list when the user is
 * signed out (rather than throwing).
 */
export function useLedgerData(options: Options) {
  const { sheet, sort, typeFilter, search, token } = options;
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(LEDGER_INITIAL_VISIBLE);

  const fetchSheet = useCallback(async () => {
    const cfg = SHEETS.find((s) => s.key === sheet);
    if (!cfg) return;
    if (cfg.requiresAuth && !token) { setRawPosts([]); return; }
    setLoading(true);
    try {
      const res = await api.get(cfg.endpoint, {
        params: { offset: 0, limit: LEDGER_PAGE_SIZE },
      });
      const list: Post[] = res.data?.[cfg.responseKey] ?? [];
      setRawPosts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Ledger sheet fetch failed (%s):", cfg.endpoint, e);
      setRawPosts([]);
    } finally {
      setLoading(false);
    }
  }, [sheet, token]);

  useEffect(() => { void fetchSheet(); }, [fetchSheet]);

  // Reset the "load more" cursor whenever the visible set could change beneath
  // us — otherwise a user switching sheets would still be scrolled past the
  // top of the new one.
  useEffect(() => {
    setVisibleCount(LEDGER_INITIAL_VISIBLE);
  }, [sheet, sort, typeFilter, search]);

  const allRows: LedgerRow[] = useMemo(() => {
    const filtered = applyClientFilters(rawPosts, typeFilter, search);
    const sorted = [...filtered].sort(SORTERS[sort]);
    return sorted.map(buildLedgerRow);
  }, [rawPosts, typeFilter, search, sort]);

  const rows = useMemo(() => allRows.slice(0, visibleCount), [allRows, visibleCount]);
  const hasMore = allRows.length > visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((n) => n + LEDGER_LOAD_MORE_STEP);
  }, []);

  const totalLikes = useMemo(
    () => rows.reduce((sum, r) => sum + r.displayLikes, 0),
    [rows],
  );

  return {
    rows,
    loading,
    totalLikes,
    totalAvailable: allRows.length,
    hasMore,
    loadMore,
    refresh: fetchSheet,
  };
}
