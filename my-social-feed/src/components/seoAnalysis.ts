// Pure analysis helpers for the SEO toolkit. No React, no side effects —
// each function takes a blob of state and returns a derived score or list.
// This keeps the toolkit's render file focused on layout (rule 7).

import {
  AI_BANNED_PHRASES,
  CLICKBAIT_PATTERNS,
  HIGH_AUTHORITY_DOMAINS,
  LSI_SYNONYMS,
  KEYWORD_DENSITY_MIN,
  KEYWORD_DENSITY_MAX,
} from "./seoConstants";

// Scoring point weights (rule 8 — no bare integers).
const HEADLINE_LENGTH_GOOD_POINTS = 25;
const HEADLINE_LENGTH_OK_POINTS = 10;
const HEADLINE_KEYWORD_POINTS = 25;
const HEADLINE_HAS_DIGIT_POINTS = 10;
const HEADLINE_POWER_WORD_POINTS = 15;
const HEADLINE_NOT_CLICKBAIT_POINTS = 15;
const HEADLINE_WORD_COUNT_POINTS = 10;
const HEADLINE_LENGTH_MIN_CHARS = 30;
const HEADLINE_LENGTH_MAX_CHARS = 60;
const HEADLINE_WORD_COUNT_MIN = 5;
const HEADLINE_WORD_COUNT_MAX = 12;

/** Strip HTML tags + collapse whitespace to a single-line plain-text version
    of the post body, ready for word counting and phrase scanning. */
export function htmlToPlainText(html: string): string {
  // [^<>], not [^>]: on "<<<<…" with no ">" each attempt stops at the next
  // "<" instead of scanning to the end, so a hostile paste stays linear.
  return html.replace(/<[^<>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Return every AI-cliché phrase present in `plainText`. */
export function findAiCliches(plainText: string): string[] {
  const lower = plainText.toLowerCase();
  return AI_BANNED_PHRASES.filter((phrase) => lower.includes(phrase.toLowerCase()));
}

/** `text` as a literal regex pattern: every metacharacter escaped, so a
    keyword like "c++" or "(draft" matches itself instead of throwing (or
    backtracking forever) inside new RegExp. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Percentage of `plainText` occupied by `keyword` matches (0-100). */
export function computeKeywordDensity(plainText: string, keyword: string, wordCount: number): number {
  if (!keyword || wordCount === 0) return 0;
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp - escaped
  const regex = new RegExp(escapeRegExp(keyword), "gi");
  const matches = plainText.match(regex) || [];
  return Math.round((matches.length / wordCount) * 1000) / 10;
}

/** True when at least one `<h2>` in the post body contains the keyword. */
export function keywordInH2(html: string, keyword: string): boolean {
  if (!keyword) return false;
  const h2s = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  return h2s.some((h) => h.toLowerCase().includes(keyword));
}

/** Overall headline quality on a 0-100 scale. */
export function computeHeadlineScore(effectiveTitle: string, keyword: string): number {
  const t = effectiveTitle.trim();
  let score = 0;
  if (t.length >= HEADLINE_LENGTH_MIN_CHARS && t.length <= HEADLINE_LENGTH_MAX_CHARS) score += HEADLINE_LENGTH_GOOD_POINTS;
  else if (t.length > 0) score += HEADLINE_LENGTH_OK_POINTS;
  if (keyword && t.toLowerCase().includes(keyword)) score += HEADLINE_KEYWORD_POINTS;
  if (/\d/.test(t)) score += HEADLINE_HAS_DIGIT_POINTS;
  if (/how|why|what|guide|tips|best|top/i.test(t)) score += HEADLINE_POWER_WORD_POINTS;
  if (!CLICKBAIT_PATTERNS.some((p) => p.test(t))) score += HEADLINE_NOT_CLICKBAIT_POINTS;
  const words = t.split(" ").length;
  if (words >= HEADLINE_WORD_COUNT_MIN && words <= HEADLINE_WORD_COUNT_MAX) score += HEADLINE_WORD_COUNT_POINTS;
  return Math.min(100, score);
}

/** List clickbait patterns present in the effective title, formatted for display. */
export function findClickbaitWarnings(effectiveTitle: string): string[] {
  const t = effectiveTitle.trim();
  return CLICKBAIT_PATTERNS
    .filter((p) => p.test(t))
    .map((p) => p.source.replace(/\\|\//g, "").replace(/i$/, ""));
}

/** Extract every https?:// URL that appears in an href attribute in the post body. */
export function extractExternalLinks(html: string): string[] {
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) links.push(match[1]);
  return links;
}

/** Filter `links` down to those hosted on a high-authority domain. */
export function filterAuthorityLinks(links: string[]): string[] {
  return links.filter((url) => HIGH_AUTHORITY_DOMAINS.some((d) => url.includes(d)));
}

export type ImageAltCheck = { total: number; missing: string[]; withKeyword: string[] };

/** Inspect every `<img>` tag in the post body for alt-text quality. */
export function inspectImageAltText(html: string, keyword: string): ImageAltCheck {
  const imgs = html.match(/<img[^>]*>/gi) || [];
  const missing: string[] = [];
  const withKeyword: string[] = [];
  const PREVIEW_LEN = 60;
  imgs.forEach((img) => {
    const alt = img.match(/alt=["']([^"']*)["']/i);
    if (!alt || !alt[1].trim()) missing.push(img.slice(0, PREVIEW_LEN));
    else if (keyword && alt[1].toLowerCase().includes(keyword)) withKeyword.push(alt[1]);
  });
  return { total: imgs.length, missing, withKeyword };
}

export type LsiCheck = { found: string[]; suggested: string[] };
const LSI_MAX_SUGGESTIONS = 8;

/** Which LSI-synonym variants are present in the text vs still worth adding. */
export function computeLsi(plainText: string, keyword: string): LsiCheck {
  if (!keyword) return { found: [], suggested: [] };
  const lower = plainText.toLowerCase();
  const synonyms = LSI_SYNONYMS[keyword] || [];
  const allSuggested: string[] = [...synonyms];
  Object.entries(LSI_SYNONYMS).forEach(([key, syns]) => {
    if (lower.includes(key) && key !== keyword) {
      allSuggested.push(...syns.filter((s) => !allSuggested.includes(s)));
    }
  });
  const found = allSuggested.filter((s) => lower.includes(s.toLowerCase()));
  const suggested = allSuggested.filter((s) => !lower.includes(s.toLowerCase()));
  return { found, suggested: suggested.slice(0, LSI_MAX_SUGGESTIONS) };
}

const KEYWORD_SUGGESTION_MAX = 12;
const KEYWORD_SYN_TAKE = 2;
const HEADLINE_PREFIXES = ["how to", "best", "top", "why", "what is", "guide to"];
const HEADLINE_SUFFIXES = ["guide", "tips", "tutorial", "examples", "tools", "strategy", "for beginners", "2026"];

/** Ideas for headline variations built from prefixes/suffixes + synonyms. */
export function generateKeywordSuggestions(keyword: string): string[] {
  if (!keyword) return [];
  const suggestions: string[] = [];
  HEADLINE_PREFIXES.forEach((p) => suggestions.push(`${p} ${keyword}`));
  HEADLINE_SUFFIXES.forEach((s) => suggestions.push(`${keyword} ${s}`));
  keyword.split(" ").forEach((w) => {
    const syns = LSI_SYNONYMS[w.toLowerCase()];
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp - escaped
    if (syns) syns.slice(0, KEYWORD_SYN_TAKE).forEach((syn) => suggestions.push(keyword.replace(new RegExp(escapeRegExp(w), "i"), syn)));
  });
  return [...new Set(suggestions)].slice(0, KEYWORD_SUGGESTION_MAX);
}

// Overall SEO score point weights.
const SEO_KEYWORD_IN_TITLE = 15;
const SEO_KEYWORD_IN_H2 = 10;
const SEO_KEYWORD_IN_META = 10;
const SEO_KEYWORD_IN_SLUG = 10;
const SEO_KEYWORD_DENSITY_OK = 10;
const SEO_HEADLINE_GOOD = 10;
const SEO_NO_AI = 10;
const SEO_HAS_AUTHORITY = 10;
const SEO_IMG_ALT_OK = 5;
const SEO_LSI_OK = 5;
const SEO_WORD_COUNT_OK = 5;
const SEO_HEADLINE_GOOD_THRESHOLD = 60;

type SeoScoreInputs = {
  keywordInTitle: boolean;
  keywordInH2: boolean;
  keywordInMeta: boolean;
  keywordInSlug: boolean;
  keywordDensity: number;
  headlineScore: number;
  aiClichesFound: number;
  authorityLinks: number;
  imageAltMissing: number;
  imageTotal: number;
  lsiFound: number;
  wordCount: number;
};

/** Compose the overall 0-100 SEO score from all sub-checks. */
export function computeSeoScore(x: SeoScoreInputs): number {
  let score = 0;
  if (x.keywordInTitle) score += SEO_KEYWORD_IN_TITLE;
  if (x.keywordInH2) score += SEO_KEYWORD_IN_H2;
  if (x.keywordInMeta) score += SEO_KEYWORD_IN_META;
  if (x.keywordInSlug) score += SEO_KEYWORD_IN_SLUG;
  if (x.keywordDensity >= KEYWORD_DENSITY_MIN && x.keywordDensity <= KEYWORD_DENSITY_MAX) score += SEO_KEYWORD_DENSITY_OK;
  if (x.headlineScore >= SEO_HEADLINE_GOOD_THRESHOLD) score += SEO_HEADLINE_GOOD;
  if (x.aiClichesFound === 0) score += SEO_NO_AI;
  if (x.authorityLinks >= 1) score += SEO_HAS_AUTHORITY;
  if (x.imageAltMissing === 0 && x.imageTotal > 0) score += SEO_IMG_ALT_OK;
  if (x.lsiFound >= 2) score += SEO_LSI_OK;
  if (x.wordCount >= 300) score += SEO_WORD_COUNT_OK;
  return Math.min(100, score);
}
