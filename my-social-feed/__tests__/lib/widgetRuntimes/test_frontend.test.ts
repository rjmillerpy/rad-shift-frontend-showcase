import React, { act } from "react";
import * as ReactDOMClient from "react-dom/client";
import { buildAngular, buildReact, buildSvelte, buildVue } from "@/lib/widgetRuntimes/frontend";
import { buildSimulatedRuntime } from "@/lib/widgetRuntimes/node";

const CSS = ".mine { color: red; }";
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

/** Load a generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(html: string) {
  const doc = parse(html);
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
}

// The runtimes load React, Babel and Vue from a CDN. Those globals are the external boundary:
// React is the real library, Babel/Vue are minimal stand-ins for the CDN builds.
const globals = globalThis as unknown as Record<string, unknown>;
afterEach(() => {
  for (const name of ["React", "ReactDOM", "Babel", "Vue"]) delete globals[name];
});

describe("buildReact", () => {
  const transform = jest.fn((code: string) => ({ code }));
  beforeEach(() => {
    transform.mockClear();
    Object.assign(globals, { React, ReactDOM: ReactDOMClient, Babel: { transform } });
  });

  it("loads React, ReactDOM and Babel from the CDN before the runner", () => {
    const sources = Array.from(parse(buildReact("x")).querySelectorAll("script"), (s) => s.getAttribute("src"));
    expect(sources).toEqual([
      expect.stringContaining("react@18"),
      expect.stringContaining("react-dom@18"),
      expect.stringContaining("@babel/standalone"),
      null,
    ]);
  });

  it.each([
    ["module.exports", 'module.exports = () => React.createElement("h1", null, "Hello");'],
    ["exports.default", 'exports.default = () => React.createElement("h1", null, "Hello");'],
  ])("transpiles the user's code with the react preset and mounts the component from %s", async (_label, code) => {
    await act(async () => run(buildReact(code)));
    expect(transform).toHaveBeenCalledWith(code, { presets: ["react"] });
    expect(document.querySelector("#root h1")?.textContent).toBe("Hello");
  });

  it("renders nothing when the code exports no component", async () => {
    await act(async () => run(buildReact("const unused = 1;")));
    expect(document.getElementById("root")?.innerHTML).toBe("");
  });

  it.each([
    ["a transpile failure", "<<<", () => { throw new Error("Unexpected token"); }, "Error: Unexpected token"],
    ["a runtime failure", 'throw new Error("boom");', (code: string) => ({ code }), "Error: boom"],
  ])("shows %s inside #root", (_label, code, impl, message) => {
    transform.mockImplementationOnce(impl);
    run(buildReact(code));
    expect(document.querySelector("#root .error")?.textContent).toBe(message);
  });

  it("restores the page's console after a successful run", async () => {
    const { log } = console;
    await act(async () => run(buildReact("const unused = 1;")));
    expect(console.log).toBe(log);
  });
});

describe("buildVue", () => {
  const mount = jest.fn();
  const createApp = jest.fn<{ mount: jest.Mock }, [unknown]>(() => ({ mount }));
  beforeEach(() => {
    jest.clearAllMocks();
    globals.Vue = { createApp };
  });

  it("loads Vue 3 from the CDN before the runner", () => {
    const sources = Array.from(parse(buildVue("x")).querySelectorAll("script"), (s) => s.getAttribute("src"));
    expect(sources).toEqual([expect.stringContaining("vue@3"), null]);
  });

  it("runs the user's code with Vue in scope", () => {
    run(buildVue('Vue.createApp({ template: "<p>mine</p>" }).mount("#app");'));
    expect(createApp).toHaveBeenCalledWith({ template: "<p>mine</p>" });
    expect(mount).toHaveBeenCalledWith("#app");
  });

  it("mounts a placeholder app when the user's code leaves #app empty", () => {
    run(buildVue("const unused = 1;"));
    expect(createApp).toHaveBeenCalledTimes(1);
    expect(createApp).toHaveBeenCalledWith({ template: expect.stringContaining("Vue app loaded") });
    expect(mount).toHaveBeenCalledWith("#app");
  });

  it("does not mount the placeholder when the user's code filled #app", () => {
    run(buildVue('document.getElementById("app").innerHTML = "<p>done</p>";'));
    expect(createApp).not.toHaveBeenCalled();
    expect(document.querySelector("#app p")?.textContent).toBe("done");
  });

  it("shows a thrown error inside #app", () => {
    run(buildVue('throw new Error("boom");'));
    expect(document.querySelector("#app .error")?.textContent).toBe("Error: boom");
  });
});

describe.each([
  ["buildReact", buildReact],
  ["buildVue", buildVue],
])("%s document", (_name, build) => {
  it("is a complete document that includes user CSS and never leaks 'undefined'", () => {
    expect(parse(build("x", CSS)).querySelector("style")?.textContent).toContain(CSS);
    const html = build("x");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toMatch(/<\/html>$/);
    expect(html).not.toContain("undefined");
  });
});

describe.each([
  ["buildAngular", buildAngular, "Angular"],
  ["buildSvelte", buildSvelte, "Svelte"],
])("%s", (_name, build, label) => {
  it.each([
    ["without css", undefined],
    ["with css", CSS],
  ])(`falls back to the simulated ${label} runtime %s`, (_label, css) => {
    const code = "<h1>{title}</h1>";
    expect(build(code, css)).toBe(buildSimulatedRuntime(code, label, css));
  });
});
