/**
 * Workplace-safe text filter for the Ledger feed. Any word in
 * PROFANITY_LIST is replaced with a broken-formula token like `#REF!` so
 * posts read like a corrupted spreadsheet if the boss glances over.
 *
 * The filter is deterministic — the same word always maps to the same token
 * (via a stable string hash) — so React re-renders don't cause the tokens to
 * flicker as the sheet updates.
 */

// Broken-formula tokens that Excel actually shows when a cell errors out.
// Public so tests can assert the substitution set without hard-coding.
export const EXCEL_ERROR_TOKENS: readonly string[] = [
  "#REF!", "#VALUE!", "#DIV/0!", "#NAME?", "#N/A",
  "#NULL!", "#NUM!", "#SPILL!", "#CALC!", "#GETTING_DATA",
] as const;

// Words the filter treats as "not safe for work". Whole-word matches only
// (see PROFANITY_REGEX below), so `class` won't be caught for containing
// `ass`. Extend as needed — false positives are annoying but false negatives
// defeat the illusion.
const PROFANITY_LIST: readonly string[] = [
  "fuck", "fucked", "fucker", "fucking", "fucks", "motherfucker", "motherfuckers",
  "shit", "shits", "shitty", "shitting", "bullshit",
  "bitch", "bitches", "bitching",
  "asshole", "assholes", "arse", "arsehole",
  "damn", "damned", "goddamn", "goddamned",
  "dick", "dicks", "dickhead",
  "cock", "cocks", "cocksucker",
  "pussy", "pussies", "cunt", "cunts",
  "tits", "titties", "boobs",
  "faggot", "faggots",
  "prick", "wank", "wanker", "twat",
  "piss", "pissed", "pissing",
  "bastard", "bastards",
  "slut", "sluts", "whore", "whores",
];

// Escape regex metacharacters in list entries so a wordlist tweak later can't
// accidentally introduce regex syntax.
function escapeForRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PROFANITY_REGEX = new RegExp(
  `\\b(?:${PROFANITY_LIST.map(escapeForRegex).join("|")})\\b`,
  "gi",
);

// Deterministic 32-bit string hash. Not cryptographic — just enough to keep
// the same word mapping to the same token across renders.
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickErrorToken(word: string): string {
  const index = stableHash(word.toLowerCase()) % EXCEL_ERROR_TOKENS.length;
  return EXCEL_ERROR_TOKENS[index];
}

/**
 * Replace any profanity in `text` with a broken-formula token. Case-
 * insensitive, whole-word matches only, deterministic. Safe on empty/null-ish
 * input (returns the input unchanged when there's nothing to scan).
 */
export function sanitize(text: string): string {
  if (!text) return text;
  return text.replace(PROFANITY_REGEX, (match) => pickErrorToken(match));
}
