"use client";
import React from "react";
import {
  HIGH_AUTHORITY_DOMAINS,
  KEYWORD_DENSITY_MIN,
  KEYWORD_DENSITY_MAX,
  MIN_WORD_COUNT_SEO,
  MAX_WORD_COUNT_SEO,
  SCORE_GOOD_THRESHOLD,
  SCORE_OK_THRESHOLD,
} from "./seoConstants";
import type { ImageAltCheck, LsiCheck } from "./seoAnalysis";

// OG length limits shown in the OpenGraph tab.
const OG_TITLE_LIMIT = 70;
const OG_DESCRIPTION_LIMIT = 200;
const URL_PREVIEW_CHARS = 60;

function scoreColor(score: number): string {
  if (score >= SCORE_GOOD_THRESHOLD) return "#28a745";
  if (score >= SCORE_OK_THRESHOLD) return "#ffc107";
  return "#dc3545";
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = scoreColor(score);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontWeight: "bold", color }}>{score}/100</span>
      </div>
      <div style={{ background: "#e9ecef", borderRadius: 4, height: 6 }}>
        <div style={{ width: `${score}%`, background: color, borderRadius: 4, height: "100%", transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export function Check({ pass, text }: { pass: boolean; text: string }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4, fontSize: 12 }}>
      <span style={{ color: pass ? "#28a745" : "#dc3545", flexShrink: 0 }}>{pass ? "✓" : "✗"}</span>
      <span style={{ color: pass ? "#333" : "#c00" }}>{text}</span>
    </div>
  );
}

type OverviewProps = {
  seoScore: number;
  headlineScore: number;
  keyword: string;
  keywordInTitle: boolean;
  keywordInH2: boolean;
  keywordInMeta: boolean;
  keywordInSlug: boolean;
  keywordDensity: number;
  wordCount: number;
  aiCount: number;
  authorityCount: number;
  clickbaitCount: number;
};

export function OverviewTab(p: OverviewProps) {
  const densityOk = p.keywordDensity >= KEYWORD_DENSITY_MIN && p.keywordDensity <= KEYWORD_DENSITY_MAX;
  return (
    <div data-testid="seo-overview">
      <ScoreBar score={p.seoScore} label="Overall SEO Score" />
      <ScoreBar score={p.headlineScore} label="Headline Score" />
      <div style={{ marginTop: 8 }}>
        <Check pass={p.keywordInTitle} text={`Keyword "${p.keyword || "..."}" in title`} />
        <Check pass={p.keywordInH2} text="Keyword in at least one H2" />
        <Check pass={p.keywordInMeta} text="Keyword in meta description" />
        <Check pass={p.keywordInSlug} text="Keyword in URL slug" />
        <Check pass={densityOk} text={`Keyword density: ${p.keywordDensity}% (aim for ${KEYWORD_DENSITY_MIN}-${KEYWORD_DENSITY_MAX}%)`} />
        <Check pass={p.wordCount >= MIN_WORD_COUNT_SEO} text={`Word count: ${p.wordCount} (min ${MIN_WORD_COUNT_SEO})`} />
        <Check pass={p.aiCount === 0} text={`AI clichés: ${p.aiCount === 0 ? "None found" : p.aiCount + " found"}`} />
        <Check pass={p.authorityCount >= 1} text={`Authority links: ${p.authorityCount} found`} />
        <Check pass={p.clickbaitCount === 0} text={`Clickbait check: ${p.clickbaitCount === 0 ? "Clean" : p.clickbaitCount + " warnings"}`} />
      </div>
    </div>
  );
}

type KeywordsProps = {
  keywordDensity: number;
  lsi: LsiCheck;
  suggestions: string[];
  keywordInTitle: boolean;
  keywordInH2: boolean;
  keywordInMeta: boolean;
  keywordInSlug: boolean;
};

export function KeywordsTab(p: KeywordsProps) {
  const densityOk = p.keywordDensity >= KEYWORD_DENSITY_MIN && p.keywordDensity <= KEYWORD_DENSITY_MAX;
  return (
    <div data-testid="seo-keywords">
      <h4 style={{ margin: "0 0 8px 0", fontSize: 13 }}>Keyword Density</h4>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px 0" }}>
        Target: {KEYWORD_DENSITY_MIN}-{KEYWORD_DENSITY_MAX}%. Current:{" "}
        <strong style={{ color: densityOk ? "#28a745" : "#dc3545" }}>{p.keywordDensity}%</strong>
      </p>

      <h4 style={{ margin: "12px 0 8px 0", fontSize: 13 }}>LSI / Natural Variations</h4>
      {p.lsi.found.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#28a745" }}>Found: </span>
          {p.lsi.found.map((w) => <span key={w} style={{ fontSize: 11, background: "#d4edda", padding: "1px 6px", borderRadius: 8, marginRight: 4 }}>{w}</span>)}
        </div>
      )}
      {p.lsi.suggested.length > 0 && (
        <div>
          <span style={{ fontSize: 11, color: "#888" }}>Consider adding: </span>
          {p.lsi.suggested.map((w) => <span key={w} style={{ fontSize: 11, background: "#f0f0f0", padding: "1px 6px", borderRadius: 8, marginRight: 4 }}>{w}</span>)}
        </div>
      )}

      <h4 style={{ margin: "12px 0 8px 0", fontSize: 13 }}>Keyword Suggestions for Headlines</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {p.suggestions.map((s) => (
          <span key={s} data-testid="keyword-suggestion" style={{ fontSize: 11, background: "#eef", padding: "2px 8px", borderRadius: 8, cursor: "pointer" }}>{s}</span>
        ))}
      </div>

      <h4 style={{ margin: "12px 0 8px 0", fontSize: 13 }}>Keyword Placement Check</h4>
      <Check pass={p.keywordInTitle} text="In title" />
      <Check pass={p.keywordInH2} text="In H2 heading" />
      <Check pass={p.keywordInMeta} text="In meta description" />
      <Check pass={p.keywordInSlug} text="In URL slug" />
    </div>
  );
}

export function ContentTab({ aiCliches, clickbaits, wordCount }: { aiCliches: string[]; clickbaits: string[]; wordCount: number }) {
  return (
    <div data-testid="seo-content">
      <h4 style={{ margin: "0 0 8px 0", fontSize: 13 }}>AI Cliché Check</h4>
      {aiCliches.length === 0 ? (
        <p style={{ fontSize: 12, color: "#28a745" }}>✓ No AI clichés detected</p>
      ) : (
        <div>
          <p style={{ fontSize: 12, color: "#dc3545", margin: "0 0 4px 0" }}>✗ Found {aiCliches.length} AI clichés (remove before publishing):</p>
          {aiCliches.map((phrase) => (
            <span key={phrase} data-testid="ai-cliche" style={{ fontSize: 11, background: "#fce4ec", padding: "2px 8px", borderRadius: 8, marginRight: 4, marginBottom: 4, display: "inline-block" }}>
              &quot;{phrase}&quot;
            </span>
          ))}
        </div>
      )}
      <h4 style={{ margin: "12px 0 8px 0", fontSize: 13 }}>Clickbait Headline Check</h4>
      {clickbaits.length === 0 ? (
        <p style={{ fontSize: 12, color: "#28a745" }}>✓ Headline is not clickbait-y</p>
      ) : (
        <div>
          <p style={{ fontSize: 12, color: "#ffc107" }}>⚠ Clickbait patterns detected:</p>
          {clickbaits.map((w) => <span key={w} style={{ fontSize: 11, background: "#fff3cd", padding: "2px 8px", borderRadius: 8, marginRight: 4 }}>{w}</span>)}
        </div>
      )}
      <h4 style={{ margin: "12px 0 8px 0", fontSize: 13 }}>Readability</h4>
      <Check pass={wordCount >= MIN_WORD_COUNT_SEO} text={`${wordCount} words (min ${MIN_WORD_COUNT_SEO} for SEO)`} />
      <Check pass={wordCount <= MAX_WORD_COUNT_SEO} text={`Under ${MAX_WORD_COUNT_SEO} word limit`} />
    </div>
  );
}

export function LinksTab({ external, authority }: { external: string[]; authority: string[] }) {
  return (
    <div data-testid="seo-links">
      <h4 style={{ margin: "0 0 8px 0", fontSize: 13 }}>External Links ({external.length})</h4>
      <Check pass={external.length >= 2} text={`At least 2 external links (found ${external.length})`} />
      <Check pass={authority.length >= 1} text={`At least 1 high-authority link (found ${authority.length})`} />
      {external.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {external.map((url, i) => {
            const isAuthority = HIGH_AUTHORITY_DOMAINS.some((d) => url.includes(d));
            return (
              <div key={i} style={{ fontSize: 11, marginBottom: 2, display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ color: isAuthority ? "#28a745" : "#888" }}>{isAuthority ? "★" : "○"}</span>
                <span style={{ color: "#555", wordBreak: "break-all" }}>{url.slice(0, URL_PREVIEW_CHARS)}</span>
              </div>
            );
          })}
        </div>
      )}
      <h4 style={{ margin: "12px 0 4px 0", fontSize: 13 }}>Auto-link Suggestions</h4>
      <p style={{ fontSize: 11, color: "#888" }}>
        Consider linking key terms to Wikipedia or relevant reference sites for SEO authority.
      </p>
    </div>
  );
}

export function ImagesTab({ check, keyword }: { check: ImageAltCheck; keyword: string }) {
  return (
    <div data-testid="seo-images">
      <h4 style={{ margin: "0 0 8px 0", fontSize: 13 }}>Image Alt Text Check</h4>
      <Check pass={check.total > 0} text={`${check.total} image(s) found`} />
      <Check pass={check.missing.length === 0}
        text={check.missing.length === 0 ? "All images have alt text" : `${check.missing.length} missing alt text`} />
      {keyword && <Check pass={check.withKeyword.length > 0} text={`${check.withKeyword.length} image(s) with keyword in alt text`} />}
    </div>
  );
}

export function OpenGraphTab({ title, description, image, keyword }: { title: string; description: string; image: string; keyword: string }) {
  return (
    <div data-testid="seo-opengraph">
      <h4 style={{ margin: "0 0 8px 0", fontSize: 13 }}>Open Graph Check</h4>
      <Check pass={!!title} text={`og:title set (${title.length} chars)`} />
      <Check pass={title.length <= OG_TITLE_LIMIT} text={`og:title length ≤ ${OG_TITLE_LIMIT} chars (${title.length})`} />
      <Check pass={!!description} text={`og:description set (${description.length} chars)`} />
      <Check pass={description.length <= OG_DESCRIPTION_LIMIT} text={`og:description length ≤ ${OG_DESCRIPTION_LIMIT} chars`} />
      <Check pass={!!image} text="og:image set" />
      {keyword && <Check pass={title.toLowerCase().includes(keyword)} text="Keyword in og:title" />}
      <h4 style={{ margin: "12px 0 8px 0", fontSize: 13 }}>Twitter Card</h4>
      <Check pass={!!image} text={`Card type: ${image ? "summary_large_image" : "summary"}`} />
      <Check pass={title.length <= OG_TITLE_LIMIT} text="Title fits Twitter limit" />
      <Check pass={description.length <= OG_DESCRIPTION_LIMIT} text="Description fits Twitter limit" />
    </div>
  );
}
