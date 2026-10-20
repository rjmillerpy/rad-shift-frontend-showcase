"use client";
import { useState, useMemo, useId } from "react";
import {
  computeHeadlineScore,
  computeKeywordDensity,
  computeLsi,
  computeSeoScore,
  extractExternalLinks,
  filterAuthorityLinks,
  findAiCliches,
  findClickbaitWarnings,
  generateKeywordSuggestions,
  htmlToPlainText,
  inspectImageAltText,
  keywordInH2 as checkKeywordInH2,
} from "./seoAnalysis";
import {
  ContentTab,
  ImagesTab,
  KeywordsTab,
  LinksTab,
  OpenGraphTab,
  OverviewTab,
} from "./SeoToolkitTabs";

type SeoToolkitProps = {
  title: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  tags: string;
  targetKeyword: string;
  onTargetKeywordChange: (kw: string) => void;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  featuredImage?: string;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "keywords", label: "Keywords" },
  { key: "content", label: "Content" },
  { key: "links", label: "Links" },
  { key: "images", label: "Images" },
  { key: "opengraph", label: "OG" },
];

export default function SeoToolkit({
  title, contentHtml, seoTitle, seoDescription, slug, targetKeyword, onTargetKeywordChange,
  ogTitle = "", ogDescription = "", ogImage = "", featuredImage = "",
}: SeoToolkitProps) {
  const fieldId = useId(); // ties each <label> to its control (htmlFor/id)
  const [activeTab, setActiveTab] = useState<string>("overview");

  const plainText = useMemo(() => htmlToPlainText(contentHtml), [contentHtml]);
  const words = useMemo(() => plainText.split(/\s+/).filter(Boolean), [plainText]);
  const wordCount = words.length;
  const keyword = targetKeyword.toLowerCase().trim();

  const aiCheck = useMemo(() => findAiCliches(plainText), [plainText]);
  const keywordDensity = useMemo(
    () => computeKeywordDensity(plainText, keyword, wordCount),
    [keyword, plainText, wordCount],
  );

  const keywordInTitle = keyword ? title.toLowerCase().includes(keyword) : false;
  const keywordInH2 = useMemo(() => checkKeywordInH2(contentHtml, keyword), [contentHtml, keyword]);
  const keywordInMeta = keyword ? seoDescription.toLowerCase().includes(keyword) : false;
  const keywordInSlug = keyword ? slug.toLowerCase().includes(keyword.replace(/\s+/g, "-")) : false;

  const effectiveTitle = seoTitle || title;
  const headlineScore = useMemo(
    () => computeHeadlineScore(effectiveTitle, keyword),
    [effectiveTitle, keyword],
  );
  const clickbaitWarnings = useMemo(() => findClickbaitWarnings(effectiveTitle), [effectiveTitle]);

  const externalLinks = useMemo(() => extractExternalLinks(contentHtml), [contentHtml]);
  const authorityLinks = useMemo(() => filterAuthorityLinks(externalLinks), [externalLinks]);
  const imageAltCheck = useMemo(() => inspectImageAltText(contentHtml, keyword), [contentHtml, keyword]);
  const lsiCheck = useMemo(() => computeLsi(plainText, keyword), [keyword, plainText]);
  const keywordSuggestions = useMemo(() => generateKeywordSuggestions(keyword), [keyword]);

  const seoScore = useMemo(() => computeSeoScore({
    keywordInTitle, keywordInH2, keywordInMeta, keywordInSlug,
    keywordDensity, headlineScore,
    aiClichesFound: aiCheck.length,
    authorityLinks: authorityLinks.length,
    imageAltMissing: imageAltCheck.missing.length,
    imageTotal: imageAltCheck.total,
    lsiFound: lsiCheck.found.length,
    wordCount,
  }), [
    keywordInTitle, keywordInH2, keywordInMeta, keywordInSlug,
    keywordDensity, headlineScore, aiCheck, authorityLinks,
    imageAltCheck, lsiCheck, wordCount,
  ]);

  return (
    <div data-testid="seo-toolkit" style={{ border: "1px solid #ddd", borderRadius: 6, background: "#fff" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
        {TABS.map((t) => (
          <button key={t.key} data-testid={`seo-tab-${t.key}`}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 14px", border: "none",
              borderBottom: activeTab === t.key ? "2px solid #007bff" : "2px solid transparent",
              background: "none", cursor: "pointer", fontSize: 12,
              fontWeight: activeTab === t.key ? "bold" : "normal",
              color: activeTab === t.key ? "#007bff" : "#666",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor={`${fieldId}-target-keyword`} style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4 }}>Target Keyword</label>
          <input id={`${fieldId}-target-keyword`} data-testid="target-keyword" type="text" value={targetKeyword}
            onChange={(e) => onTargetKeywordChange(e.target.value)}
            placeholder="Enter your target keyword..."
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }} />
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            seoScore={seoScore}
            headlineScore={headlineScore}
            keyword={keyword}
            keywordInTitle={keywordInTitle}
            keywordInH2={keywordInH2}
            keywordInMeta={keywordInMeta}
            keywordInSlug={keywordInSlug}
            keywordDensity={keywordDensity}
            wordCount={wordCount}
            aiCount={aiCheck.length}
            authorityCount={authorityLinks.length}
            clickbaitCount={clickbaitWarnings.length}
          />
        )}
        {activeTab === "keywords" && (
          <KeywordsTab
            keywordDensity={keywordDensity}
            lsi={lsiCheck}
            suggestions={keywordSuggestions}
            keywordInTitle={keywordInTitle}
            keywordInH2={keywordInH2}
            keywordInMeta={keywordInMeta}
            keywordInSlug={keywordInSlug}
          />
        )}
        {activeTab === "content" && (
          <ContentTab aiCliches={aiCheck} clickbaits={clickbaitWarnings} wordCount={wordCount} />
        )}
        {activeTab === "links" && (
          <LinksTab external={externalLinks} authority={authorityLinks} />
        )}
        {activeTab === "images" && (
          <ImagesTab check={imageAltCheck} keyword={keyword} />
        )}
        {activeTab === "opengraph" && (
          <OpenGraphTab
            title={ogTitle || title}
            description={ogDescription || seoDescription}
            image={ogImage || featuredImage}
            keyword={keyword}
          />
        )}
      </div>
    </div>
  );
}
