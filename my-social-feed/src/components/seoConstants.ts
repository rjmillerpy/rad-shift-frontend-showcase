// Shared constants for the SEO toolkit — kept out of the JSX file so the
// long word lists don't drown out the component's structure (rule 15/60).

// AI-writing cliché ban list. If any of these appear in the plain text of a
// blog post, the toolkit warns the author to rewrite. Also used by the blog
// editor to gate publish (see src/app/blog/new/constants.ts::AI_BANNED for
// the smaller subset applied at publish-time).
export const AI_BANNED_PHRASES = [
  "delve", "utilize", "leverage", "pivotal", "groundbreaking", "game-changer",
  "in a world where", "it's worth noting", "at the end of the day",
  "when all is said and done", "needless to say", "it goes without saying",
  "in today's fast-paced", "in this day and age", "a testament to",
  "the landscape of", "navigate the complexities", "harness the power",
  "shed light on", "pave the way", "foster a sense of", "a myriad of",
  "cutting-edge", "state-of-the-art", "paradigm shift", "synergy",
  "holistic approach", "deep dive", "unlock the potential",
  "robust", "seamless", "streamline", "empower", "revolutionize",
];

// Domains treated as high-authority for link scoring. Substring match, so
// gov / edu automatically covers all .gov and .edu subdomains.
export const HIGH_AUTHORITY_DOMAINS = [
  "wikipedia.org", "gov", "edu", "nytimes.com", "bbc.com", "reuters.com",
  "nature.com", "science.org", "nih.gov", "cdc.gov", "who.int",
  "harvard.edu", "mit.edu", "stanford.edu", "oxford.ac.uk",
  "github.com", "stackoverflow.com", "mdn.mozilla.org",
];

// Clickbait phrase patterns that dock the headline score.
export const CLICKBAIT_PATTERNS = [
  /you won't believe/i, /shocking/i, /mind-blowing/i, /this one weird/i,
  /doctors hate/i, /number \d+ will/i, /what happens next/i,
  /\d+ reasons why/i, /secret that/i, /you need to see/i,
  /will blow your mind/i, /changed my life/i,
  // A bounded gap, not .*: no backtracking blow-up on long text.
  /everything you know.{0,60}wrong/i,
];

// Latent semantic index synonym groups — used to spot natural language
// variations the author could add for topical coverage.
export const LSI_SYNONYMS: Record<string, string[]> = {
  "blog": ["article", "post", "content", "piece", "write-up"],
  "write": ["author", "compose", "create", "draft", "pen"],
  "seo": ["search engine", "optimization", "ranking", "serp", "organic"],
  "money": ["revenue", "income", "earnings", "profit", "monetize"],
  "good": ["excellent", "quality", "valuable", "useful", "effective"],
  "make": ["create", "build", "develop", "produce", "generate"],
  "big": ["large", "significant", "substantial", "major", "considerable"],
  "important": ["crucial", "essential", "vital", "key", "critical"],
  "start": ["begin", "launch", "initiate", "commence", "kick off"],
  "help": ["assist", "support", "guide", "aid", "facilitate"],
};

// Score thresholds shown on the coloured progress bars.
export const SCORE_GOOD_THRESHOLD = 70;
export const SCORE_OK_THRESHOLD = 40;

// Keyword-density target window (percentage of total words).
export const KEYWORD_DENSITY_MIN = 0.5;
export const KEYWORD_DENSITY_MAX = 3;

// Article length window for readability score.
export const MIN_WORD_COUNT_SEO = 300;
export const MAX_WORD_COUNT_SEO = 5000;
