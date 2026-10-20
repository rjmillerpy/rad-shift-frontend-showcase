import { PAGE_SIZE, MOSAIC_PAGE_SIZE, BLOG_PAGE_SIZE, BUBBLES_PAGE_SIZE } from "@/lib/constants";

describe("constants", () => {
  it("PAGE_SIZE is a positive number", () => {
    expect(typeof PAGE_SIZE).toBe("number");
    expect(PAGE_SIZE).toBeGreaterThan(0);
  });

  it("MOSAIC_PAGE_SIZE is a positive number", () => {
    expect(typeof MOSAIC_PAGE_SIZE).toBe("number");
    expect(MOSAIC_PAGE_SIZE).toBeGreaterThan(0);
  });

  it("BLOG_PAGE_SIZE is a positive number", () => {
    expect(typeof BLOG_PAGE_SIZE).toBe("number");
    expect(BLOG_PAGE_SIZE).toBeGreaterThan(0);
  });

  it("BUBBLES_PAGE_SIZE is a positive number", () => {
    expect(typeof BUBBLES_PAGE_SIZE).toBe("number");
    expect(BUBBLES_PAGE_SIZE).toBeGreaterThan(0);
  });

  it("all constants are exported and have expected types", () => {
    expect(PAGE_SIZE).toBeDefined();
    expect(MOSAIC_PAGE_SIZE).toBeDefined();
    expect(BLOG_PAGE_SIZE).toBeDefined();
    expect(BUBBLES_PAGE_SIZE).toBeDefined();
  });
});
