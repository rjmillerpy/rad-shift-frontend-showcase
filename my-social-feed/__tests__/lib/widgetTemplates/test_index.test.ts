import * as templates from "@/lib/widgetTemplates";
import { CATEGORY_MAP, getTemplateForCategory, type WidgetTemplate } from "@/lib/widgetTemplates";
import { CATEGORY_META } from "@/lib/widgetTemplates/meta";
import { MULTI_PANEL_TEMPLATES } from "@/lib/widgetTemplates/multiPanel";
import { CATEGORY_MAP as TYPES_CATEGORY_MAP } from "@/lib/widgetTemplates/types";

const CATEGORIES = Object.entries(CATEGORY_MAP);

describe("widgetTemplates index", () => {
  it("exports exactly the public API the widget pages import", () => {
    expect(Object.keys(templates).sort()).toEqual(["CATEGORY_MAP", "getTemplateForCategory"]);
  });

  it("re-exports the one CATEGORY_MAP rather than a copy", () => {
    expect(CATEGORY_MAP).toBe(TYPES_CATEGORY_MAP);
  });
});

describe("getTemplateForCategory", () => {
  it.each(CATEGORIES)("%s: labels the template from the category metadata", (label, apiValue) => {
    const template = getTemplateForCategory(label);
    expect(template.name).toBe(label);
    expect(template.emoji).toBe(CATEGORY_META[apiValue].emoji);
    expect(template.description).toBe(CATEGORY_META[apiValue].description);
  });

  it.each(CATEGORIES)("%s: uses the multi-panel starter registered for %s", (label, apiValue) => {
    const template = getTemplateForCategory(label);
    const starter = MULTI_PANEL_TEMPLATES[apiValue];
    expect(template).toMatchObject({ html: starter.html, css: starter.css, js: starter.js });
    expect(template.compute).toBe(starter.compute);
    expect(template.computeLanguage).toBe(starter.computeLanguage);
  });

  it.each(CATEGORIES)("%s: gives the same template for the API value %s as for the label", (label, apiValue) => {
    expect(getTemplateForCategory(apiValue)).toEqual(getTemplateForCategory(label));
  });

  it("returns a fresh object each call so callers can edit their copy", () => {
    const first = getTemplateForCategory("Tools");
    first.html = "<p>edited</p>";
    expect(getTemplateForCategory("Tools").html).toBe(MULTI_PANEL_TEMPLATES.tool.html);
  });

  it.each([
    ["an unknown category", "Mystery"],
    ["a label in the wrong case", "games"],
    ["an empty category", ""],
  ])("falls back to a generic, working stub for %s", (_label, category) => {
    const template: WidgetTemplate = getTemplateForCategory(category);
    expect(template).toMatchObject({ name: category, emoji: "📦", description: "Widget template" });
    expect(template.compute).toBeUndefined();
    expect(template.computeLanguage).toBeUndefined();

    document.body.innerHTML = template.html;
    new Function(template.js)();
    expect(document.getElementById("output")?.textContent).toBe("Widget loaded!");
    expect(template.css).toContain("#output");
  });

  it("does not hand the fallback stub to any known category", () => {
    const stub = getTemplateForCategory("Mystery");
    for (const [label] of CATEGORIES) expect(getTemplateForCategory(label).js).not.toBe(stub.js);
  });
});
