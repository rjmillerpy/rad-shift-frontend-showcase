import type { Post } from "@/types/post";

// ── Sheets (tabs at the bottom of the workbook) ─────────────────────────────
export const SHEET_KEYS = ["algo", "following", "saved", "drafts"] as const;
export type SheetKey = (typeof SHEET_KEYS)[number];

// ── Columns (A, B, C, D, E, F across the header) ────────────────────────────
export const COLUMN_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
export type ColumnKey = (typeof COLUMN_KEYS)[number];

// ── Sort options in the ribbon dropdown ─────────────────────────────────────
export const SORT_KEYS = ["recent", "oldest", "likes", "reposts"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

// ── Media type filter ───────────────────────────────────────────────────────
export const TYPE_FILTERS = ["all", "text", "image", "video", "audio"] as const;
export type TypeFilter = (typeof TYPE_FILTERS)[number];

// Classified media kind of a post; used both by the filter and by the type
// icon column (column E).
export type MediaKind = "text" | "image" | "video" | "audio";

/** Selected cell within the grid. `row` is 0-based post index; `col` is a
    column letter. */
export type CellCoord = {
  row: number;
  col: ColumnKey;
};

/** A row in the grid — one post plus its derived visible fields. Kept as a
    plain shape (not a class) since it's a value object (rule 54).

    `rawName`/`rawText` are the SFW-sanitized full-length strings used by the
    formula bar and the edit input's initial value; `displayName`/`displayText`
    are the same strings truncated for cell display. Never expose
    `post.username` / `post.text` directly to the grid — always go through the
    raw* fields. */
export type LedgerRow = {
  post: Post;
  rawName: string;
  rawText: string;
  displayName: string;
  displayText: string;
  displayLikes: number;
  displayReposts: number;
  mediaKind: MediaKind;
  displayWhen: string;
};
