import {
  BUBBLE_IMAGE_SIZES,
  FEED_IMAGE_SIZES,
  GALLERY_CELL_SIZES,
  LIGHTBOX_IMAGE_SIZES,
  srcSetFor,
  type ImageVariants,
} from "@/lib/imageVariants";

const ORIGINAL = "https://bucket.s3.amazonaws.com/posts/alice_1_0.jpg";
const VARIANTS: ImageVariants = {
  [ORIGINAL]: {
    "1280": "https://bucket.s3.amazonaws.com/variants/posts/alice_1_0-1280.webp",
    "4000": ORIGINAL,
    "480": "https://bucket.s3.amazonaws.com/variants/posts/alice_1_0-480.webp",
  },
};

describe("srcSetFor", () => {
  it("lists every recorded width, narrowest first, original included", () => {
    expect(srcSetFor(VARIANTS, ORIGINAL)).toBe(
      "https://bucket.s3.amazonaws.com/variants/posts/alice_1_0-480.webp 480w, " +
        "https://bucket.s3.amazonaws.com/variants/posts/alice_1_0-1280.webp 1280w, " +
        `${ORIGINAL} 4000w`,
    );
  });

  it("applies the view's URL transform to every candidate", () => {
    const proxied = srcSetFor(VARIANTS, ORIGINAL, (u) => `/proxy?u=${encodeURIComponent(u)}`);
    expect(proxied?.split(", ").every((c) => c.startsWith("/proxy?u="))).toBe(true);
  });

  it.each([
    ["no variants yet", null, ORIGINAL],
    ["another image", VARIANTS, "https://bucket.s3.amazonaws.com/posts/other.jpg"],
    ["no url", VARIANTS, null],
  ])("is undefined with %s", (_label, variants, url) => {
    expect(srcSetFor(variants as ImageVariants | null, url)).toBeUndefined();
  });

  it("ignores widths that aren't positive whole numbers", () => {
    const odd: ImageVariants = { [ORIGINAL]: { "0": "a", abc: "b", "1.5": "c", "-480": "d", "480": "e" } };
    expect(srcSetFor(odd, ORIGINAL)).toBe("e 480w");
  });

  it("is undefined when nothing usable is left", () => {
    expect(srcSetFor({ [ORIGINAL]: { abc: "b" } }, ORIGINAL)).toBeUndefined();
  });

  it("drops a candidate the transform rejects", () => {
    expect(srcSetFor(VARIANTS, ORIGINAL, (u) => (u === ORIGINAL ? undefined : u))).not.toContain("4000w");
  });
});

describe("sizes hints", () => {
  it.each([FEED_IMAGE_SIZES, GALLERY_CELL_SIZES, LIGHTBOX_IMAGE_SIZES, BUBBLE_IMAGE_SIZES])(
    "%s ends in a length the browser can use",
    (sizes) => {
      expect(sizes).toMatch(/\d+(px|vw)$/);
    },
  );
});
