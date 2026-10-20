/**
 * Tests for src/lib/widgetRuntimes.ts — wraps user code with per-language
 * browser runtimes for iframe execution.
 */
import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";

const SAMPLE_CSS = ".my-custom-marker { color: red; }";

describe("wrapCodeForBrowser", () => {
  describe.each([
    ["html", "<h1>hi</h1>"],
    ["javascript", "console.log('hi')"],
    ["typescript", "const x: number = 1;"],
    ["python", "print('hi')"],
    ["ruby", "puts 'hi'"],
    ["php", "<?php echo 'hi'; ?>"],
    ["sql", "SELECT 1"],
    ["lua", "print('hi')"],
    ["c", "int main() { return 0; }"],
    ["cpp", "int main() { return 0; }"],
    ["csharp", "class C {}"],
    ["golang", "package main"],
    ["rust", "fn main() {}"],
    ["react", "const App = () => <div>hi</div>;"],
    ["vue", "<template><div>hi</div></template>"],
    ["angular", "@Component({}) class App {}"],
    ["svelte", "<h1>hi</h1>"],
    ["nodejs", "console.log('hi')"],
    ["nextjs", "export default function Page() {}"],
    ["basic", "10 PRINT 'HELLO'"],
    ["fortran", "program hello\nend program"],
    ["cobol", "IDENTIFICATION DIVISION."],
    ["assembly", "section .text"],
    ["visual_basic", "Sub Main() End Sub"],
  ])("for language %s", (language, snippet) => {
    test("returns an HTML string", () => {
      const html = wrapCodeForBrowser(snippet, language);
      // `html` language passes through raw code; others wrap with <!DOCTYPE>
      if (language === "html") {
        expect(html).toContain(snippet);
      } else {
        expect(html).toMatch(/^<!DOCTYPE html>/i);
        expect(html).toMatch(/<\/html>\s*$/i);
      }
    });

    test("embeds user CSS when provided", () => {
      const html = wrapCodeForBrowser(snippet, language, SAMPLE_CSS);
      expect(html).toContain(SAMPLE_CSS);
    });
  });

  test("case-insensitive language lookup", () => {
    const lower = wrapCodeForBrowser("print('hi')", "python");
    const upper = wrapCodeForBrowser("print('hi')", "PYTHON");
    const mixed = wrapCodeForBrowser("print('hi')", "PyThOn");
    // All three should hit the same builder (not fall through to simulated runtime)
    expect(lower.length).toBeGreaterThan(100);
    expect(upper.length).toBe(lower.length);
    expect(mixed.length).toBe(lower.length);
  });

  test("unknown language falls through to simulated runtime", () => {
    const html = wrapCodeForBrowser("some-code", "klingon");
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    // Simulated runtime renders the code as-is in the output
    expect(html).toContain("some-code");
  });

  test("html language preserves user content", () => {
    const html = wrapCodeForBrowser("<div id='marker-abc'>hi</div>", "html");
    expect(html).toContain("marker-abc");
  });

  test("javascript payload is escaped into the runtime", () => {
    const snippet = 'const s = "has \\"quotes\\"";';
    const html = wrapCodeForBrowser(snippet, "javascript");
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    // Code must survive embedding
    expect(html).toContain('has');
  });

  test.each([
    ["python", "pyodide"],
    ["ruby", "ruby"],
    ["php", "php"],
    ["sql", "sql.js"],
    ["lua", "fengari"],
  ])("%s runtime references %s interpreter", (language, expectedInterpreter) => {
    const html = wrapCodeForBrowser("x", language).toLowerCase();
    expect(html).toContain(expectedInterpreter);
  });

  test("simulated runtime shows language label", () => {
    const html = wrapCodeForBrowser("SUB MAIN()", "visual_basic");
    expect(html.toLowerCase()).toMatch(/visual[_\s]?basic/);
  });

  test("empty code produces a valid document", () => {
    const html = wrapCodeForBrowser("", "javascript");
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    expect(html.length).toBeGreaterThan(50);
  });

  test("omitted css does not inject undefined", () => {
    const html = wrapCodeForBrowser("print('hi')", "python");
    expect(html).not.toContain("undefined");
  });
});
