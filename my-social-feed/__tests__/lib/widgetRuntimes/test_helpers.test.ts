import { wrapWithMultiScript, wrapWithRuntime } from "@/lib/widgetRuntimes/helpers";

const CDN = "https://cdn.example.com/interp.js";

/** Load a generated document into jsdom and execute its inline scripts, as the sandboxed iframe would. */
function runInline(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  const inline = Array.from(doc.querySelectorAll("script:not([src])"), (s) => s.textContent).join("\n");
  new Function(inline)();
  return document.getElementById("output") as HTMLElement;
}

const externalScripts = (html: string) =>
  Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("script[src]"), (s) =>
    s.getAttribute("src"),
  );

const WRAPPERS: [string, (runner: string, css?: string) => string][] = [
  ["wrapWithRuntime", (runner, css) => wrapWithRuntime("src", "Lang", CDN, runner, css)],
  ["wrapWithMultiScript", (runner, css) => wrapWithMultiScript("src", "Lang", [CDN], runner, css)],
];

describe.each(WRAPPERS)("%s", (_name, wrap) => {
  it("produces a complete HTML document with a loading placeholder for the language", () => {
    const html = wrap("");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toMatch(/<\/html>$/);
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.getElementById("output")?.textContent).toContain("Loading Lang runtime...");
  });

  it("loads the interpreter before the runner script", () => {
    const doc = new DOMParser().parseFromString(wrap("print('x')"), "text/html");
    const scripts = Array.from(doc.querySelectorAll("script"));
    expect(scripts.map((s) => s.getAttribute("src"))).toEqual([CDN, null]);
  });

  it("gives the runner print() and printErr() that write to #output, clearing the placeholder", () => {
    const output = runInline(wrap("print('one'); print(2); printErr('bad');"));
    expect(output.textContent).toBe("one\n2\nbad\n");
    expect(output.querySelector(".error")?.textContent).toBe("bad");
  });

  it("puts user CSS inside the style block", () => {
    const doc = new DOMParser().parseFromString(wrap("", ".mine { color: red; }"), "text/html");
    expect(doc.querySelector("style")?.textContent).toContain(".mine { color: red; }");
  });

  it("does not leak 'undefined' into the document when css is omitted", () => {
    expect(wrap("")).not.toContain("undefined");
  });
});

describe("wrapWithRuntime", () => {
  it("emits no external script tag when the interpreter URL is empty", () => {
    expect(externalScripts(wrapWithRuntime("src", "Lang", "", "print(1)"))).toEqual([]);
  });
});

describe("wrapWithMultiScript", () => {
  it.each([
    ["no scripts", []],
    ["one script", ["https://a.example/a.js"]],
    ["three scripts", ["https://a.example/a.js", "https://b.example/b.js", "https://c.example/c.js"]],
  ])("emits external script tags in the given order for %s", (_label, scripts) => {
    expect(externalScripts(wrapWithMultiScript("src", "Lang", scripts, "print(1)"))).toEqual(scripts);
  });
});
