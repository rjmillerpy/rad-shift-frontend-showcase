import { fireEvent } from "@testing-library/react";
import { MULTI_PANEL_TEMPLATES } from "@/lib/widgetTemplates/multiPanel";
import { CATEGORY_MAP } from "@/lib/widgetTemplates/types";

const TEMPLATES = Object.entries(MULTI_PANEL_TEMPLATES);
const WITH_COMPUTE = TEMPLATES.filter(([, t]) => t.compute !== undefined || t.computeLanguage !== undefined);
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

/** Mount a template's HTML panel in jsdom and run its JS panel against it, as the preview iframe would. */
function mount(category: string) {
  const { html, js } = MULTI_PANEL_TEMPLATES[category];
  document.body.innerHTML = html;
  new Function(js)();
}

describe("MULTI_PANEL_TEMPLATES", () => {
  it("has a starter for exactly the categories the API knows", () => {
    expect(Object.keys(MULTI_PANEL_TEMPLATES).sort()).toEqual(Object.values(CATEGORY_MAP).sort());
  });

  it.each(TEMPLATES)("%s has non-empty HTML, CSS and JS panels", (_category, template) => {
    expect(parse(template.html).body.children.length).toBeGreaterThan(0);
    expect(template.css).toMatch(/[^{}]+\{[^{}]+\}/);
    expect(template.js.trim()).not.toBe("");
  });

  it.each(TEMPLATES)("%s JS only looks up element ids that its HTML defines", (_category, template) => {
    const doc = parse(template.html);
    const ids = Array.from(template.js.matchAll(/getElementById\("([^"]+)"\)/g), (m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => doc.getElementById(id) === null)).toEqual([]);
  });

  it.each(TEMPLATES)("%s JS is syntactically valid", (_category, template) => {
    expect(() => new Function(template.js)).not.toThrow();
  });

  it.each(TEMPLATES)("%s CSS has balanced braces", (_category, template) => {
    expect(template.css.split("{").length).toBe(template.css.split("}").length);
  });

  it.each(["html", "css", "js"] as const)("gives every category a distinct %s panel", (panel) => {
    const panels = TEMPLATES.map(([, template]) => template[panel]);
    expect(new Set(panels).size).toBe(panels.length);
  });

  it("offers compute panels for exactly the server-backed categories", () => {
    expect(WITH_COMPUTE.map(([category]) => category).sort()).toEqual(["api_connector", "db_connector", "lambda"]);
  });

  it.each(WITH_COMPUTE)("%s pairs its compute code with a supported compute language", (_category, template) => {
    expect(template.compute?.trim()).toBeTruthy();
    expect(["python", "sql"]).toContain(template.computeLanguage);
  });

  it.each([
    ["lambda", /^def handler\(event\):/m],
    ["api_connector", /^import requests$/m],
    ["db_connector", /^SELECT \* FROM users;$/m],
  ])("%s compute code is written in its declared language", (category, marker) => {
    expect(MULTI_PANEL_TEMPLATES[category].compute).toMatch(marker);
  });
});

describe("starter templates run as written", () => {
  it("tool: upper-cases the input into the output on click", () => {
    mount("tool");
    fireEvent.change(document.getElementById("input") as HTMLInputElement, { target: { value: "hello" } });
    fireEvent.click(document.getElementById("btn") as HTMLButtonElement);
    expect(document.getElementById("output")?.textContent).toBe("Processed: HELLO");
  });

  it("game: counts clicks on the canvas", () => {
    mount("game");
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    fireEvent.click(canvas);
    fireEvent.click(canvas);
    expect(document.getElementById("score")?.textContent).toBe("Score: 2");
  });

  it("social: posts trimmed messages newest-first, clears the input and ignores blanks", () => {
    mount("social");
    const input = document.getElementById("msg") as HTMLInputElement;
    const send = document.getElementById("send") as HTMLButtonElement;
    fireEvent.change(input, { target: { value: "  first  " } });
    fireEvent.click(send);
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(send);
    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const posts = Array.from(document.querySelectorAll("#feed .post"), (p) => p.textContent ?? "");
    expect(posts).toHaveLength(2);
    expect(posts[0]).toMatch(/ - second$/);
    expect(posts[1]).toMatch(/ - first$/);
  });

  it("visualization: draws one bar and one label per data point", () => {
    mount("visualization");
    const ctx = (document.getElementById("chart") as HTMLCanvasElement).getContext("2d");
    const labels = (ctx as unknown as { __getDrawCalls(): { type: string; props: { text?: string } }[] })
      .__getDrawCalls()
      .filter((call) => call.type === "fillText")
      .map((call) => call.props.text);
    expect(labels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });
});
