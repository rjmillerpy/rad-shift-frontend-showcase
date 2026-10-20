import { COLUMN_KEYS, type ColumnKey, type SheetKey, type SortKey, type TypeFilter } from "./types";

/**
 * Excel-style column label for a 0-based index.
 *   0 → "A", 25 → "Z", 26 → "AA", 51 → "AZ", 52 → "BA", ...
 * Kept pure so it can be unit-tested and called at module load.
 */
export function columnLetter(index: number): string {
  if (index < 0) return "";
  let n = index + 1;
  let out = "";
  // Bounded loop (rule 31): index < Number.MAX_SAFE_INTEGER means at most
  // ~11 iterations, since each step divides by 26.
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

// ── Excel-accurate color palette ────────────────────────────────────────────
// These are drawn from the Office 365 UI so the illusion holds at a glance.
export const EXCEL = {
  green: "#217346",          // Office green — sheet-tab underline, buttons
  greenDark: "#185b34",      // hover
  ribbonBg: "#f3f2f1",        // ribbon panel background
  titleBarBg: "#217346",      // title bar (green in modern Office)
  titleBarText: "#ffffff",
  gridLine: "#d0d7de",        // cell borders
  rowBand: "#f8f9fa",         // banded (even) row
  rowWhite: "#ffffff",
  header: "#f0f0f0",          // A/B/C column header background
  headerText: "#333333",
  selectedRow: "#e7f3ea",     // selected row background (Excel selection tint)
  selectedBorder: "#217346",  // 2px border around the selected cell
  formulaBarBg: "#ffffff",
  formulaBarBorder: "#c8c6c4",
  statusBarBg: "#f3f2f1",
  statusBarText: "#605e5c",
  cellText: "#252423",
  subtleText: "#605e5c",
} as const;

// ── Typography ──────────────────────────────────────────────────────────────
// Segoe UI is the real deal on Windows; the fallbacks approximate on other OSes.
export const FONT_FAMILY = "'Segoe UI', 'Aptos', system-ui, sans-serif";

// ── Grid geometry ───────────────────────────────────────────────────────────
export const ROW_HEIGHT_PX = 24;         // classic Excel row height
export const ROW_NUMBER_COL_WIDTH_PX = 40;
export const HEADER_ROW_HEIGHT_PX = 22;

// Column widths per Excel column letter (matches the visual layout above).
export const COLUMN_WIDTHS: Record<ColumnKey, number> = {
  A: 130,  // User
  B: 520,  // Text (wide — the main column)
  C: 70,   // Likes
  D: 80,   // Reposts
  E: 60,   // Type icon
  F: 100,  // When
};

// Extra empty columns to the right so the grid feels like a real workbook:
// you can scroll horizontally into blank space and it appears endless. The
// count is a rendering trade-off — enough that a user will not scroll past
// it in a session, small enough to keep the row DOM cheap.
export const PADDING_COLUMN_COUNT = 50;
export const PADDING_COL_WIDTH_PX = 96;
export const PADDING_COLUMNS: readonly string[] = Array.from(
  { length: PADDING_COLUMN_COUNT },
  (_, i) => columnLetter(i + COLUMN_KEYS.length),
);

// Empty rows rendered below the last post so the sheet keeps going like a
// real workbook. Doesn't affect selection or counts.
export const EMPTY_ROW_COUNT = 15;

// Row / column resize bounds
export const MIN_COL_WIDTH_PX = 30;
export const MAX_COL_WIDTH_PX = 900;
export const MIN_ROW_HEIGHT_PX = 14;
export const MAX_ROW_HEIGHT_PX = 200;
export const RESIZE_HANDLE_PX = 5;

// Breathing room between the green title bar and the ribbon tabs so their
// labels don't visually kiss the bar.
export const TITLEBAR_BOTTOM_GAP_PX = 8;

// Column labels displayed in the header row.
export const COLUMN_LABELS: Record<ColumnKey, string> = {
  A: "User",
  B: "Text",
  C: "Likes",
  D: "Reposts",
  E: "Type",
  F: "When",
};

// ── Zoom (status-bar slider) ────────────────────────────────────────────────
export const ZOOM_MIN_PCT = 60;
export const ZOOM_MAX_PCT = 200;
export const ZOOM_DEFAULT_PCT = 100;
export const ZOOM_STEP_PCT = 10;

// ── Data loading ────────────────────────────────────────────────────────────
export const LEDGER_PAGE_SIZE = 200;
// Rows shown before the user clicks "Load more". Kept low so the initial
// paint feels snappy and pagination is discoverable.
export const LEDGER_INITIAL_VISIBLE = 25;
export const LEDGER_LOAD_MORE_STEP = 25;

// Max characters shown in a cell before ellipsis. B (text) is the widest;
// A/F are much narrower. Applied in the row renderer.
export const CELL_TEXT_MAX_CHARS: Record<ColumnKey, number> = {
  A: 20,
  B: 100,
  C: 8,
  D: 8,
  E: 4,
  F: 12,
};

// ── Sheet configuration ─────────────────────────────────────────────────────
// SheetKey → { label, endpoint, requiresAuth }. When adding a new sheet the
// only touch-point is this record (rule 44 — replace long if/elif with a map).
export type SheetConfig = {
  key: SheetKey;
  label: string;
  endpoint: string;
  requiresAuth: boolean;
  responseKey: "posts" | "drafts";
};

export const SHEETS: SheetConfig[] = [
  { key: "algo",       label: "Algo",       endpoint: "/posts/algo",       requiresAuth: false, responseKey: "posts" },
  { key: "following",  label: "Following",  endpoint: "/posts/following",  requiresAuth: true,  responseKey: "posts" },
  { key: "saved",      label: "Saved",      endpoint: "/posts/saved",      requiresAuth: true,  responseKey: "posts" },
  { key: "drafts",     label: "Drafts",     endpoint: "/posts/drafts",     requiresAuth: true,  responseKey: "drafts" },
];

// ── Sort configuration ──────────────────────────────────────────────────────
export const SORT_LABELS: Record<SortKey, string> = {
  recent: "Newest first",
  oldest: "Oldest first",
  likes: "Most liked",
  reposts: "Most reposted",
};

// ── Type filter configuration ───────────────────────────────────────────────
export const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
  all: "All",
  text: "Text",
  image: "Image",
  video: "Video",
  audio: "Audio",
};

// ── Media type icons (column E) ─────────────────────────────────────────────
export const MEDIA_TYPE_ICON: Record<string, string> = {
  text: "📄",
  image: "🖼",
  video: "🎬",
  audio: "🎵",
};

// ── Relative-time thresholds (column F) ─────────────────────────────────────
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86_400;

// ── Fake filename in the title bar (for the illusion) ───────────────────────
export const FAKE_WORKBOOK_TITLE = "Q3_Financials_v2_FINAL_reviewed.xlsx";

// ── Fake app wordmark shown on the left side of the title bar ──────────────
export const APP_WORDMARK = "Sheets";

// ── Keyboard shortcut sentinel for "focus search" (rule 8) ─────────────────
export const SEARCH_FOCUS_KEY = "/";

// ── Ribbon menu tabs (pure decoration — clicking does nothing yet) ─────────
export const RIBBON_TABS = [
  "File", "Home", "Insert", "Draw", "Formulas",
  "Data", "Review", "View", "Automate", "Help",
] as const;
export type RibbonTab = (typeof RIBBON_TABS)[number];

// ── Fake toolbar buttons. Data-driven so we can add another group without
//    touching the render code (rule 44). Each button fires a short toast so
//    the illusion feels alive without doing anything real. ─────────────────
export type FunButton = {
  key: string;
  label: string;
  title: string;
  toast: string;
  bold?: boolean;
};

export type FunButtonGroup = {
  title: string;
  buttons: FunButton[];
};

export const TOOLBAR_GROUPS: FunButtonGroup[] = [
  {
    title: "Clipboard",
    buttons: [
      { key: "save",  label: "💾",  title: "Save",        toast: "Autosaved to OneDrive ✓" },
      { key: "cut",   label: "✂",   title: "Cut",         toast: "Cut to clipboard" },
      { key: "copy",  label: "🗐",  title: "Copy",        toast: "Copied to clipboard" },
      { key: "paste", label: "📋",  title: "Paste",       toast: "Nothing to paste" },
    ],
  },
  {
    title: "Font",
    buttons: [
      { key: "bold",   label: "B",  title: "Bold",           toast: "Bold applied",   bold: true },
      { key: "italic", label: "I",  title: "Italic",         toast: "Italic applied" },
      { key: "under",  label: "U",  title: "Underline",      toast: "Underlined" },
      { key: "strike", label: "S̶",  title: "Strikethrough",  toast: "You're being petty" },
      { key: "fill",   label: "🎨",  title: "Fill Color",     toast: "Cell filled" },
    ],
  },
  {
    title: "Alignment",
    buttons: [
      { key: "left",   label: "⬅",  title: "Align Left",     toast: "Left aligned" },
      { key: "center", label: "☰",  title: "Center",         toast: "Centered" },
      { key: "right",  label: "➡",  title: "Align Right",    toast: "Right aligned" },
      { key: "merge",  label: "▬",  title: "Merge & Center", toast: "Cells merged" },
    ],
  },
  {
    title: "Number",
    buttons: [
      { key: "dollar",  label: "$",  title: "Accounting",  toast: "Accounting format applied" },
      { key: "percent", label: "%",  title: "Percent",     toast: "10 → 1000%" },
      { key: "comma",   label: ",",  title: "Thousands",   toast: "1,000 separators added" },
      { key: "decrease",label: ".00→.0", title: "Fewer decimals", toast: "Rounded" },
      { key: "increase",label: ".0→.00", title: "More decimals",  toast: "Precision boost" },
    ],
  },
  {
    title: "Insert",
    buttons: [
      { key: "chart", label: "📊 Chart",   title: "Insert Chart",       toast: "📈 up-and-to-the-right chart inserted" },
      { key: "pivot", label: "PivotTable", title: "Insert PivotTable",  toast: "PivotTable will be ready in Q4" },
      { key: "func",  label: "ƒx",         title: "Insert Function",    toast: "=VLOOKUP(gossip, watercooler, 2, FALSE)" },
    ],
  },
];
