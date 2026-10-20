import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SeoToolkit from "@/components/SeoToolkit";

const defaultProps = {
  title: "How to Build a Blog",
  contentHtml: "<p>This is a test blog post about building blogs. Building a blog requires planning and effort.</p>",
  seoTitle: "How to Build a Blog - Complete Guide",
  seoDescription: "Learn how to build a blog from scratch with this guide.",
  slug: "how-to-build-a-blog",
  tags: "blog, writing, seo",
  targetKeyword: "build a blog",
  onTargetKeywordChange: jest.fn(),
};

describe("SeoToolkit", () => {
  describe("Rendering", () => {
    it("renders the toolkit", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByTestId("seo-toolkit")).toBeInTheDocument();
    });

    it("shows all tabs", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByTestId("seo-tab-overview")).toBeInTheDocument();
      expect(screen.getByTestId("seo-tab-keywords")).toBeInTheDocument();
      expect(screen.getByTestId("seo-tab-content")).toBeInTheDocument();
      expect(screen.getByTestId("seo-tab-links")).toBeInTheDocument();
      expect(screen.getByTestId("seo-tab-images")).toBeInTheDocument();
    });

    it("shows target keyword input", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByTestId("target-keyword")).toBeInTheDocument();
    });
  });

  describe("Overview tab", () => {
    it("shows SEO score", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByText("Overall SEO Score")).toBeInTheDocument();
    });

    it("shows headline score", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByText("Headline Score")).toBeInTheDocument();
    });

    it("checks keyword in title", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByText(/Keyword.*in title/)).toBeInTheDocument();
    });

    it("checks keyword in meta description", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByText(/Keyword in meta description/)).toBeInTheDocument();
    });

    it("checks keyword in slug", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByText(/Keyword in URL slug/)).toBeInTheDocument();
    });

    it("checks AI clichés", () => {
      render(<SeoToolkit {...defaultProps} />);
      expect(screen.getByText(/AI clichés/)).toBeInTheDocument();
    });
  });

  describe("Keywords tab", () => {
    it("shows keyword density", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-keywords"));
      expect(screen.getByText("Keyword Density")).toBeInTheDocument();
    });

    it("shows keyword suggestions", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-keywords"));
      const suggestions = screen.getAllByTestId("keyword-suggestion");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("shows LSI variations", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-keywords"));
      expect(screen.getByText("LSI / Natural Variations")).toBeInTheDocument();
    });

    it("shows keyword placement check", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-keywords"));
      expect(screen.getByText("Keyword Placement Check")).toBeInTheDocument();
    });
  });

  describe("Content tab", () => {
    it("shows AI cliché check with no clichés", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-content"));
      expect(screen.getByText(/No AI clichés detected/)).toBeInTheDocument();
    });

    it("flags AI clichés when present", () => {
      render(<SeoToolkit {...defaultProps} contentHtml="<p>We need to delve into this and leverage our synergy.</p>" />);
      fireEvent.click(screen.getByTestId("seo-tab-content"));
      const cliches = screen.getAllByTestId("ai-cliche");
      expect(cliches.length).toBeGreaterThanOrEqual(2);
    });

    it("shows clickbait check", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-content"));
      expect(screen.getByText(/Clickbait Headline Check/)).toBeInTheDocument();
    });

    it("flags clickbait headline", () => {
      render(<SeoToolkit {...defaultProps} title="You Won't Believe What Happened Next" seoTitle="" />);
      fireEvent.click(screen.getByTestId("seo-tab-content"));
      expect(screen.getByText(/Clickbait patterns detected/)).toBeInTheDocument();
    });

    it("shows readability stats", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-content"));
      expect(screen.getByText(/min 300 for SEO/)).toBeInTheDocument();
    });
  });

  describe("Links tab", () => {
    it("checks for external links", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-links"));
      expect(screen.getByText(/External Links/)).toBeInTheDocument();
    });

    it("detects authority links", () => {
      render(<SeoToolkit {...defaultProps} contentHtml='<p>Check <a href="https://en.wikipedia.org/wiki/Blog">Wikipedia</a></p>' />);
      fireEvent.click(screen.getByTestId("seo-tab-links"));
      expect(screen.getByText(/1 high-authority link/)).toBeInTheDocument();
    });

    it("shows auto-link suggestions", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-links"));
      expect(screen.getByText(/Auto-link Suggestions/)).toBeInTheDocument();
    });
  });

  describe("Images tab", () => {
    it("checks image alt text", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-images"));
      expect(screen.getByText(/Image Alt Text Check/)).toBeInTheDocument();
    });

    it("flags missing alt text", () => {
      render(<SeoToolkit {...defaultProps} contentHtml='<p><img src="test.jpg" /></p>' />);
      fireEvent.click(screen.getByTestId("seo-tab-images"));
      expect(screen.getByText(/1 missing alt text/)).toBeInTheDocument();
    });

    it("detects keyword in alt text", () => {
      render(<SeoToolkit {...defaultProps} contentHtml='<p><img src="test.jpg" alt="how to build a blog" /></p>' />);
      fireEvent.click(screen.getByTestId("seo-tab-images"));
      expect(screen.getByText(/1 image.*with keyword in alt text/)).toBeInTheDocument();
    });
  });

  describe("Open Graph tab", () => {
    it("shows OG checks", () => {
      render(<SeoToolkit {...defaultProps} ogTitle="OG Test Title" ogDescription="OG description" ogImage="https://img.com/og.jpg" />);
      fireEvent.click(screen.getByTestId("seo-tab-opengraph"));
      expect(screen.getByTestId("seo-opengraph")).toBeInTheDocument();
      expect(screen.getByText(/og:title set/)).toBeInTheDocument();
      expect(screen.getByText(/og:description set/)).toBeInTheDocument();
      expect(screen.getByText(/og:image set/)).toBeInTheDocument();
    });

    it("checks og:title length limit", () => {
      render(<SeoToolkit {...defaultProps} ogTitle={"A".repeat(80)} />);
      fireEvent.click(screen.getByTestId("seo-tab-opengraph"));
      expect(screen.getByText(/80 chars/)).toBeInTheDocument();
    });

    it("shows twitter card type", () => {
      render(<SeoToolkit {...defaultProps} ogImage="https://img.com/og.jpg" />);
      fireEvent.click(screen.getByTestId("seo-tab-opengraph"));
      expect(screen.getByText(/summary_large_image/)).toBeInTheDocument();
    });

    it("falls back to title when no og:title", () => {
      render(<SeoToolkit {...defaultProps} />);
      fireEvent.click(screen.getByTestId("seo-tab-opengraph"));
      expect(screen.getByText(/og:title set/)).toBeInTheDocument();
    });

    it("checks keyword in og:title", () => {
      render(<SeoToolkit {...defaultProps} ogTitle="How to build a blog quickly" />);
      fireEvent.click(screen.getByTestId("seo-tab-opengraph"));
      expect(screen.getByText(/Keyword in og:title/)).toBeInTheDocument();
    });
  });

  describe("Target keyword", () => {
    it("calls onTargetKeywordChange when input changes", () => {
      const mock = jest.fn();
      render(<SeoToolkit {...defaultProps} onTargetKeywordChange={mock} />);
      fireEvent.change(screen.getByTestId("target-keyword"), { target: { value: "new keyword" } });
      expect(mock).toHaveBeenCalledWith("new keyword");
    });
  });
});
