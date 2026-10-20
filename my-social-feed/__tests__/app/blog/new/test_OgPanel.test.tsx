import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import OgPanel from "@/app/blog/new/OgPanel";
import { OG_DESCRIPTION_MAX_CHARS, OG_TITLE_MAX_CHARS } from "@/app/blog/new/constants";

type Values = {
  open?: boolean; title?: string; seoDescription?: string; featuredImage?: string;
  ogTitle?: string; ogDescription?: string; ogImage?: string;
};

const setup = (values: Values = {}) => {
  const handlers = {
    onToggle: jest.fn(),
    onOgTitleChange: jest.fn(),
    onOgDescriptionChange: jest.fn(),
    onOgImageChange: jest.fn(),
  };
  render(
    <OgPanel
      open={values.open ?? true}
      title={values.title ?? ""}
      seoDescription={values.seoDescription ?? ""}
      featuredImage={values.featuredImage ?? ""}
      ogTitle={values.ogTitle ?? ""}
      ogDescription={values.ogDescription ?? ""}
      ogImage={values.ogImage ?? ""}
      {...handlers}
    />,
  );
  return handlers;
};

const PREVIEWS = ["og-twitter-preview", "og-facebook-preview"] as const;

describe("OgPanel", () => {
  it("is collapsed when closed, showing only the toggle", () => {
    setup({ open: false });
    expect(screen.getByTestId("toggle-og")).toHaveTextContent("▶ Open Graph (Social Sharing Preview)");
    expect(screen.queryByTestId("og-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("og-twitter-preview")).not.toBeInTheDocument();
  });

  it("shows its fields with the current values when open", () => {
    setup({ ogTitle: "Card title", ogDescription: "Card text", ogImage: "https://img.example.com/og.png" });
    expect(screen.getByTestId("toggle-og")).toHaveTextContent("▼");
    expect(screen.getByTestId("og-title")).toHaveValue("Card title");
    expect(screen.getByTestId("og-description")).toHaveValue("Card text");
    expect(screen.getByTestId("og-image")).toHaveValue("https://img.example.com/og.png");
  });

  test.each([true, false])("the toggle calls onToggle when open is %s", (open) => {
    const { onToggle } = setup({ open });
    fireEvent.click(screen.getByTestId("toggle-og"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["og-title", "onOgTitleChange", "New card title"],
    ["og-description", "onOgDescriptionChange", "New card text"],
    ["og-image", "onOgImageChange", "https://img.example.com/new.png"],
  ] as const)("typing in %s calls only %s", (testId, handler, value) => {
    const handlers = setup();
    fireEvent.change(screen.getByTestId(testId), { target: { value } });
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
    expect(handlers[handler]).toHaveBeenCalledWith(value);
    const others = (["onOgTitleChange", "onOgDescriptionChange", "onOgImageChange"] as const).filter((h) => h !== handler);
    for (const other of others) expect(handlers[other]).not.toHaveBeenCalled();
  });

  test.each([
    ["og-title", { title: "Post title" }, "Post title"],
    ["og-title", {}, "Falls back to post title"],
    ["og-description", { seoDescription: "Meta text" }, "Meta text"],
    ["og-description", {}, "Falls back to SEO description"],
    ["og-image", { featuredImage: "https://img.example.com/f.png" }, "https://img.example.com/f.png"],
    ["og-image", {}, "Falls back to featured image"],
  ])("%s placeholder with %j is '%s'", (testId, values, placeholder) => {
    setup(values);
    expect(screen.getByTestId(testId)).toHaveAttribute("placeholder", placeholder);
  });

  test.each<[string, Values, string, string]>([
    ["the OG fields when set", { ogTitle: "OG T", title: "Post T", ogDescription: "OG D", seoDescription: "SEO D" }, "OG T", "OG D"],
    ["the post title and SEO description as fallbacks", { title: "Post T", seoDescription: "SEO D" }, "Post T", "SEO D"],
    ["generic words when nothing is set", {}, "Title", "Description"],
  ])("both preview cards show %s", (_name, values, title, description) => {
    setup(values);
    for (const testId of PREVIEWS) {
      const card = within(screen.getByTestId(testId));
      expect(card.getByText(title)).toBeInTheDocument();
      expect(card.getByText(description)).toBeInTheDocument();
    }
  });

  test.each<[string, Values, string | null]>([
    ["the OG image when set", { ogImage: "https://img.example.com/og.png", featuredImage: "https://img.example.com/f.png" }, "https://img.example.com/og.png"],
    ["the featured image as a fallback", { featuredImage: "https://img.example.com/f.png" }, "https://img.example.com/f.png"],
    ["no image when neither is set", {}, null],
  ])("both preview cards show %s", (_name, values, src) => {
    setup(values);
    for (const testId of PREVIEWS) {
      const img = screen.getByTestId(testId).querySelector("img");
      expect(img?.getAttribute("src") ?? null).toBe(src);
    }
  });

  it("shows the site host on both preview cards", () => {
    setup();
    const host = window.location.host;
    expect(host).not.toBe("");
    expect(within(screen.getByTestId("og-twitter-preview")).getByText(`🔗 ${host}`)).toBeInTheDocument();
    expect(within(screen.getByTestId("og-facebook-preview")).getByText(host)).toBeInTheDocument();
  });

  test.each([
    ["the OG title at the limit", { ogTitle: "t".repeat(OG_TITLE_MAX_CHARS) }, OG_TITLE_MAX_CHARS, "#888"],
    ["the OG title one over the limit", { ogTitle: "t".repeat(OG_TITLE_MAX_CHARS + 1) }, OG_TITLE_MAX_CHARS + 1, "#c00"],
    ["the post title as a fallback, over the limit", { title: "p".repeat(OG_TITLE_MAX_CHARS + 5) }, OG_TITLE_MAX_CHARS + 5, "#c00"],
  ])("the title counter counts %s", (_name, values, length, color) => {
    setup(values);
    expect(screen.getByText(`${length}/${OG_TITLE_MAX_CHARS}`)).toHaveStyle({ color });
  });

  test.each([
    ["at the limit", OG_DESCRIPTION_MAX_CHARS, "#888"],
    ["one over the limit", OG_DESCRIPTION_MAX_CHARS + 1, "#c00"],
  ])("colours the description counter %s", (_name, length, color) => {
    setup({ ogDescription: "d".repeat(length) });
    expect(screen.getByText(`${length}/${OG_DESCRIPTION_MAX_CHARS}`)).toHaveStyle({ color });
  });
});
