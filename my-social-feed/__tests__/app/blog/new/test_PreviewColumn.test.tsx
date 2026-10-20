import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PreviewColumn from "@/app/blog/new/PreviewColumn";

type Props = React.ComponentProps<typeof PreviewColumn>;

const baseProps: Props = {
  showPreview: true,
  title: "",
  seoTitle: "",
  seoDescription: "",
  slug: "my-post",
  contentHtml: "",
  plainText: "",
  featuredImage: "",
  tags: "",
  targetKeyword: "",
  onTargetKeywordChange: jest.fn(),
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  monetized: false,
  adPlacement: "none",
};

/** Renders and waits for the lazily loaded SEO toolkit, so no update lands after the test. */
const setup = async (overrides: Partial<Props> = {}) => {
  const onTargetKeywordChange = jest.fn();
  const utils = render(<PreviewColumn {...baseProps} onTargetKeywordChange={onTargetKeywordChange} {...overrides} />);
  await screen.findByTestId("seo-toolkit");
  return { onTargetKeywordChange, ...utils };
};

const card = () => within(screen.getByTestId("link-card-preview"));

describe("PreviewColumn live preview", () => {
  it("is hidden when showPreview is off, while the SEO toolkit stays", async () => {
    await setup({ showPreview: false, title: "Hidden title" });
    expect(screen.queryByTestId("live-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("link-card-preview")).not.toBeInTheDocument();
    expect(screen.getByTestId("seo-toolkit")).toBeInTheDocument();
  });

  it("shows the post URL built from the host and slug", async () => {
    await setup({ slug: "best-beans" });
    expect(screen.getByText("Live Preview")).toBeInTheDocument();
    expect(card().getByText(`${window.location.host}/blog/best-beans`)).toBeInTheDocument();
  });

  test.each<[string, Partial<Props>, string]>([
    ["the SEO title first", { seoTitle: "SEO title", title: "Post title" }, "SEO title"],
    ["the post title next", { title: "Post title" }, "Post title"],
    ["'Untitled' last", {}, "Untitled"],
  ])("the link card title uses %s", async (_name, props, expected) => {
    await setup(props);
    expect(card().getByText(expected)).toBeInTheDocument();
  });

  test.each<[string, Partial<Props>, string]>([
    ["the SEO description first", { seoDescription: "Meta text", plainText: "Body text" }, "Meta text"],
    ["the body text next", { plainText: "Body text" }, "Body text"],
    ["the first 100 characters of a long body", { plainText: "a".repeat(100) + "b".repeat(50) }, "a".repeat(100)],
    ["'No description' last", {}, "No description"],
  ])("the link card description uses %s", async (_name, props, expected) => {
    await setup(props);
    expect(card().getByText(expected)).toBeInTheDocument();
  });

  test.each([
    ["shows the featured image", "https://img.example.com/f.png", "https://img.example.com/f.png"],
    ["shows no image without one", "", null],
  ])("the link card %s", async (_name, featuredImage, src) => {
    await setup({ featuredImage });
    const img = screen.getByTestId("link-card-preview").querySelector("img");
    expect(img?.getAttribute("src") ?? null).toBe(src);
  });

  it("invites the author to start writing when there is no content", async () => {
    await setup();
    expect(screen.getByText("Start writing to see preview...")).toBeInTheDocument();
  });

  it("renders the content as HTML with scripts and inline handlers stripped", async () => {
    await setup({
      contentHtml: '<h2>Roasting</h2><p onclick="steal()">Light <strong>roast</strong></p><script>steal()</script>',
    });
    const preview = screen.getByTestId("live-preview");
    expect(within(preview).getByRole("heading", { name: "Roasting" })).toBeInTheDocument();
    expect(within(preview).getByText("roast").tagName).toBe("STRONG");
    expect(preview.querySelector("script")).toBeNull();
    expect(preview.querySelector("[onclick]")).toBeNull();
    expect(screen.queryByText("Start writing to see preview...")).not.toBeInTheDocument();
  });

  test.each([
    [true, "minimal", true],
    [true, "standard", true],
    [true, "none", false],
    [false, "standard", false],
    [false, "none", false],
  ])("monetized=%s with '%s' placement -> ad slots shown: %s", async (monetized, adPlacement, shown) => {
    await setup({ monetized, adPlacement });
    expect(!!screen.queryByText("[Header Ad]")).toBe(shown);
    expect(!!screen.queryByText("[Footer Ad]")).toBe(shown);
  });
});

describe("PreviewColumn SEO toolkit", () => {
  it("passes the target keyword down and reports edits to it", async () => {
    const { onTargetKeywordChange } = await setup({ targetKeyword: "coffee" });
    const input = screen.getByTestId("target-keyword");
    expect(input).toHaveValue("coffee");
    fireEvent.change(input, { target: { value: "espresso" } });
    expect(onTargetKeywordChange).toHaveBeenCalledTimes(1);
    expect(onTargetKeywordChange).toHaveBeenCalledWith("espresso");
  });
});
