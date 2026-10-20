import { buildReact } from "@/lib/widgetRuntimes/frontend";
import { buildNextjs, buildNodejs, buildSimulatedRuntime } from "@/lib/widgetRuntimes/node";

/** Load a generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output") as HTMLElement;
}

describe("buildNodejs", () => {
  it.each([
    ["console.log arguments joined by spaces", 'console.log("hi", 1 + 1);', "hi 2\n"],
    ["path.join shim", 'console.log(require("path").join("a", "b", "c.txt"));', "a/b/c.txt\n"],
    ["path.basename shim", 'console.log(require("path").basename("/x/y/z.js"));', "z.js\n"],
    ["fs shim reporting no files", 'console.log(require("fs").existsSync("/etc/passwd"));', "false\n"],
    ["os shim", 'console.log(require("os").platform());', "browser\n"],
    ["util.format shim", 'console.log(require("util").format("a", 1));', "a 1\n"],
    ["process globals", "console.log(process.platform, process.argv.length);", "browser 2\n"],
    ["__dirname and __filename", "console.log(__dirname, __filename);", "/simulated /simulated/script.js\n"],
    ["module.exports aliasing exports", "exports.a = 1; console.log(module.exports.a);", "1\n"],
    ["empty program", "", ""],
  ])("runs user code with %s", (_label, program, expected) => {
    expect(run(buildNodejs(program)).textContent).toBe(expected);
  });

  it.each([
    ["console.error", 'console.error("careful");', "careful"],
    ["an uncaught exception", 'throw new Error("boom");', "Error: boom"],
    ["requiring an unavailable module", 'require("express");', 'Error: Module "express" is not available in browser simulation'],
    ["a syntax error in user code", "const = ;", /^Error: /],
  ])("shows %s as an error line", (_label, program, expected) => {
    const error = run(buildNodejs(program)).querySelector(".error");
    expect(error?.textContent).toEqual(expect.stringMatching(expected));
  });

  it("restores the page's console after the program finishes or throws", () => {
    const { log, error } = console;
    run(buildNodejs('console.log("x"); throw new Error("boom");'));
    expect(console.log).toBe(log);
    expect(console.error).toBe(error);
  });

  it("embeds quotes, backslashes, backticks and newlines from the program unchanged", () => {
    const program = "console.log('it\\'s', \"a \\\\ b\", `t${1 + 1}`);\nconsole.log('second');";
    expect(run(buildNodejs(program)).textContent).toBe("it's a \\ b t2\nsecond\n");
  });

  it("labels the loading placeholder as Node.js and includes user CSS", () => {
    const html = buildNodejs("", ".mine { color: red; }");
    expect(html).toContain("Loading Node.js runtime...");
    expect(html).toContain(".mine { color: red; }");
  });
});

describe("buildNextjs", () => {
  it.each([
    ["without css", undefined],
    ["with css", ".mine { color: red; }"],
  ])("produces the same document as the React runtime %s", (_label, css) => {
    const code = "export default function Page() { return null; }";
    expect(buildNextjs(code, css)).toBe(buildReact(code, css));
  });
});

describe("buildSimulatedRuntime", () => {
  it("shows a banner, the numbered source and a no-runtime notice", () => {
    const output = run(buildSimulatedRuntime("line one\n  line two", "Klingon"));
    expect(output.textContent).toBe(
      [
        "=== Klingon (simulated) ===",
        "",
        "  1 | line one",
        "  2 |   line two",
        "",
        "--- Output ---",
        "(Klingon does not have a browser runtime. Showing source code above.)",
        "",
      ].join("\n"),
    );
  });

  it("right-aligns line numbers so a long listing stays in columns", () => {
    const source = Array.from({ length: 100 }, (_, i) => `l${i + 1}`).join("\n");
    const lines = (run(buildSimulatedRuntime(source, "X")).textContent ?? "").split("\n");
    expect(lines).toEqual(expect.arrayContaining(["  9 | l9", " 10 | l10", "100 | l100"]));
  });

  it("shows the source as text, never as live markup", () => {
    const output = run(buildSimulatedRuntime('<img src=x onerror="alert(1)"><b>bold</b>', "X"));
    expect(output.querySelector("img, b")).toBeNull();
    expect(output.textContent).toContain('  1 | <img src=x onerror="alert(1)"><b>bold</b>');
  });

  it("handles empty input", () => {
    expect(run(buildSimulatedRuntime("", "X")).textContent).toContain("  1 | \n");
  });

  it("includes user CSS", () => {
    expect(buildSimulatedRuntime("x", "X", ".mine { color: red; }")).toContain(".mine { color: red; }");
  });
});
