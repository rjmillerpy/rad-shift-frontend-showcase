import { sanitizeHtml } from "@/lib/sanitizeHtml";

describe("sanitizeHtml", () => {
  it.each([
    ["<p>x</p><script>alert(1)</script>", "<script"],
    ['<img src="x" onerror="alert(1)">', "onerror"],
    ['<a href="javascript:alert(1)">x</a>', "javascript:"],
  ])("removes active content from %s", (dirty, forbidden) => {
    expect(sanitizeHtml(dirty)).not.toContain(forbidden);
  });

  it("keeps ordinary formatting", () => {
    const html = '<h2>T</h2><p><b>b</b> <a href="https://x.com">l</a></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});
