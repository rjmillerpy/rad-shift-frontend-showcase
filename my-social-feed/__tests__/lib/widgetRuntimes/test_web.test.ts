import { buildCss, buildHtml, buildJavaScript } from "@/lib/widgetRuntimes/web";

const CSS = ".mine { color: red; }";

/** Load the generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function runJs(code: string): HTMLElement {
  const doc = new DOMParser().parseFromString(buildJavaScript(code), "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output") as HTMLElement;
}

describe("buildHtml", () => {
  it.each([
    ["css omitted", undefined],
    ["css empty", ""],
  ])("returns the user's markup untouched when %s", (_label, css) => {
    const code = "<html><head><title>t</title></head><body><p>hi</p></body></html>";
    expect(buildHtml(code, css)).toBe(code);
  });

  it("injects the stylesheet at the end of an existing <head>", () => {
    const html = buildHtml("<html><head><title>t</title></head><body><p>hi</p></body></html>", CSS);
    expect(html).toBe(`<html><head><title>t</title><style>${CSS}</style></head><body><p>hi</p></body></html>`);
  });

  it("prepends the stylesheet to a fragment that has no <head>", () => {
    expect(buildHtml("<p>hi</p>", CSS)).toBe(`<style>${CSS}</style><p>hi</p>`);
  });

  it("keeps the user's markup intact in the parsed result", () => {
    const doc = new DOMParser().parseFromString(buildHtml('<div id="app"><h1>Title</h1></div>', CSS), "text/html");
    expect(doc.querySelector("#app h1")?.textContent).toBe("Title");
    expect(doc.querySelector("style")?.textContent).toBe(CSS);
  });
});

describe("buildJavaScript", () => {
  it.each([
    ["console.log arguments joined by spaces", 'console.log("a", 1, true);', "a 1 true\n"],
    ["several log lines in order", "console.log(1); console.log(2);", "1\n2\n"],
    ["console.warn prefixed with WARN", 'console.warn("careful");', "WARN: careful\n"],
    ["DOM access to the output element", 'document.getElementById("output").append("direct");', "direct"],
    ["empty program", "", ""],
  ])("runs %s", (_label, program, expected) => {
    expect(runJs(program).textContent).toBe(expected);
  });

  it.each([
    ["console.error", 'console.error("bad");', "bad"],
    ["an uncaught exception", 'throw new Error("boom");', "Error: boom"],
    ["a syntax error in user code", "let = ;", /^Error: /],
  ])("shows %s as an error line", (_label, program, expected) => {
    expect(runJs(program).querySelector(".error")?.textContent).toEqual(expect.stringMatching(expected));
  });

  it("restores the page's console after the program finishes or throws", () => {
    const { log, error, warn } = console;
    runJs('console.log("x"); throw new Error("boom");');
    expect([console.log, console.error, console.warn]).toEqual([log, error, warn]);
  });

  it("embeds quotes, backslashes, backticks and newlines from the program unchanged", () => {
    const program = "console.log('it\\'s', \"a \\\\ b\", `t${1 + 1}`);\nconsole.log('second');";
    expect(runJs(program).textContent).toBe("it's a \\ b t2\nsecond\n");
  });

  it("returns a complete document and includes user CSS without leaking 'undefined'", () => {
    expect(buildJavaScript("1", CSS)).toContain(CSS);
    const html = buildJavaScript("1");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toMatch(/<\/html>$/);
    expect(html).not.toContain("undefined");
  });
});

describe("buildCss", () => {
  const preview = (code: string) => new DOMParser().parseFromString(buildCss(code), "text/html");

  it("puts the user's stylesheet in the document head", () => {
    expect(preview(CSS).querySelector("head style")?.textContent).toBe(CSS);
  });

  it.each([
    ["a heading", "h1", 1],
    ["a paragraph", "p", 1],
    ["a button", "button", 1],
    ["a box", ".box", 1],
    ["list items", "ul li", 3],
    ["a text input", 'input[type="text"]', 1],
  ])("renders %s in the demo for the styles to apply to", (_label, selector, count) => {
    expect(preview(CSS).querySelectorAll(`.demo ${selector}`)).toHaveLength(count);
  });

  it("still renders the demo markup for an empty stylesheet", () => {
    const doc = preview("");
    expect(doc.querySelector("style")?.textContent).toBe("");
    expect(doc.querySelector(".demo h1")?.textContent).toBe("CSS Preview");
  });
});
