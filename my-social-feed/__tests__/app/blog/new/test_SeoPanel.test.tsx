import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SeoPanel from "@/app/blog/new/SeoPanel";
import { SEO_DESCRIPTION_MAX_CHARS, SEO_TITLE_MAX_CHARS } from "@/app/blog/new/constants";

type Values = { open?: boolean; title?: string; seoTitle?: string; seoDescription?: string; slug?: string };

const setup = (values: Values = {}) => {
  const handlers = {
    onToggle: jest.fn(),
    onSeoTitleChange: jest.fn(),
    onSeoDescriptionChange: jest.fn(),
    onSlugChange: jest.fn(),
  };
  render(
    <SeoPanel
      open={values.open ?? true}
      title={values.title ?? ""}
      seoTitle={values.seoTitle ?? ""}
      seoDescription={values.seoDescription ?? ""}
      slug={values.slug ?? ""}
      {...handlers}
    />,
  );
  return handlers;
};

describe("SeoPanel", () => {
  it("is collapsed when closed, showing only the toggle", () => {
    setup({ open: false });
    expect(screen.getByTestId("toggle-seo")).toHaveTextContent("▶ SEO Settings");
    expect(screen.queryByTestId("seo-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("seo-title")).not.toBeInTheDocument();
  });

  it("shows its fields with the current values when open", () => {
    setup({ seoTitle: "Best beans", seoDescription: "A roast guide", slug: "best-beans" });
    expect(screen.getByTestId("toggle-seo")).toHaveTextContent("▼ SEO Settings");
    expect(screen.getByTestId("seo-panel")).toBeInTheDocument();
    expect(screen.getByTestId("seo-title")).toHaveValue("Best beans");
    expect(screen.getByTestId("seo-description")).toHaveValue("A roast guide");
    expect(screen.getByTestId("seo-slug")).toHaveValue("best-beans");
    expect(screen.getByText("/blog/")).toBeInTheDocument();
  });

  test.each([true, false])("the toggle calls onToggle when open is %s", (open) => {
    const { onToggle } = setup({ open });
    fireEvent.click(screen.getByTestId("toggle-seo"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["seo-title", "onSeoTitleChange", "A sharper title"],
    ["seo-description", "onSeoDescriptionChange", "A sharper description"],
    ["seo-slug", "onSlugChange", "a-sharper-slug"],
  ] as const)("typing in %s calls only %s", (testId, handler, value) => {
    const handlers = setup();
    fireEvent.change(screen.getByTestId(testId), { target: { value } });
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
    expect(handlers[handler]).toHaveBeenCalledWith(value);
    const others = (["onSeoTitleChange", "onSeoDescriptionChange", "onSlugChange"] as const).filter((h) => h !== handler);
    for (const other of others) expect(handlers[other]).not.toHaveBeenCalled();
  });

  test.each([
    ["the post title when set", "My Post", "My Post"],
    ["a hint when there is no post title", "", "Auto-generated from title"],
  ])("uses %s as the SEO title placeholder", (_name, title, placeholder) => {
    setup({ title });
    expect(screen.getByTestId("seo-title")).toHaveAttribute("placeholder", placeholder);
  });

  test.each([
    ["the SEO title when set", "Post title", "SEO", 3],
    ["the post title as a fallback", "Post title", "", 10],
    ["zero when both are empty", "", "", 0],
  ])("counts %s", (_name, title, seoTitle, length) => {
    setup({ title, seoTitle });
    expect(screen.getByText(`${length}/${SEO_TITLE_MAX_CHARS}`)).toBeInTheDocument();
  });

  test.each([
    ["at the limit", SEO_TITLE_MAX_CHARS, "#888"],
    ["one over the limit", SEO_TITLE_MAX_CHARS + 1, "#c00"],
  ])("colours the title counter %s", (_name, length, color) => {
    setup({ seoTitle: "t".repeat(length) });
    expect(screen.getByText(`${length}/${SEO_TITLE_MAX_CHARS}`)).toHaveStyle({ color });
  });

  test.each([
    ["at the limit", SEO_DESCRIPTION_MAX_CHARS, "#888"],
    ["one over the limit", SEO_DESCRIPTION_MAX_CHARS + 1, "#c00"],
  ])("colours the description counter %s", (_name, length, color) => {
    setup({ seoDescription: "d".repeat(length) });
    expect(screen.getByText(`${length}/${SEO_DESCRIPTION_MAX_CHARS}`)).toHaveStyle({ color });
  });
});
