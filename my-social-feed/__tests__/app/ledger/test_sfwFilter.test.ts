import { sanitize, EXCEL_ERROR_TOKENS } from "@/app/ledger/sfwFilter";

const looksLikeErrorToken = (s: string): boolean =>
  EXCEL_ERROR_TOKENS.some((tok) => s.includes(tok));

describe("sanitize — passes clean text through unchanged", () => {
  it.each<[string]>([
    [""],
    ["   "],
    ["hello world"],
    ["The bears won 7 of their last 8 games"],
    ["class, brass, and grass are all fine"],   // word boundary — no false positives
    ["assassin is a word about history"],       // embedded, not standalone
    ["passion, compassion, molasses"],           // more embedded cases
  ])("%s is unchanged", (input) => {
    expect(sanitize(input)).toBe(input);
  });
});

describe("sanitize — replaces profanity with an Excel error token", () => {
  it.each<[string, string]>([
    ["one profane word", "what the fuck"],
    ["mid-sentence",     "this shit is broken"],
    ["uppercase",        "FUCK this"],
    ["mixed case",       "Bullshit"],
    ["punctuation",      "hey, bitch!"],
    ["multi-profanity",  "damn this shit is fucked"],
    ["slur family",      "asshole"],
  ])("%s: '%s' gets a token substituted", (_name, input) => {
    expect(looksLikeErrorToken(sanitize(input))).toBe(true);
  });
});

describe("sanitize — is deterministic", () => {
  it("same input maps to same output across calls", () => {
    const a = sanitize("Fuck the traffic");
    const b = sanitize("Fuck the traffic");
    expect(a).toBe(b);
  });

  it("same word (case-insensitive) maps to the same token", () => {
    const a = sanitize("fuck");
    const b = sanitize("FUCK");
    // Both should hit the same lowercase key and thus the same token.
    expect(a).toBe(b);
  });
});

describe("sanitize — preserves surrounding text", () => {
  it("keeps the words around a censored word intact", () => {
    const out = sanitize("hello fuck world");
    expect(out.startsWith("hello ")).toBe(true);
    expect(out.endsWith(" world")).toBe(true);
    expect(looksLikeErrorToken(out)).toBe(true);
  });

  it("censors multiple occurrences independently", () => {
    const out = sanitize("shit shit shit");
    const parts = out.split(" ");
    expect(parts).toHaveLength(3);
    // Each part is an Excel error token (deterministic — all the same one).
    for (const p of parts) {
      expect(EXCEL_ERROR_TOKENS).toContain(p);
    }
  });
});
