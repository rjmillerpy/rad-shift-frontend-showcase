import { CATEGORY_MAP, type WidgetTemplate } from "@/lib/widgetTemplates/types";

describe("CATEGORY_MAP", () => {
  it.each([
    ["Games", "game"],
    ["Tools", "tool"],
    ["API Connectors", "api_connector"],
    ["Display Modifiers", "display_modifier"],
    ["Lambda", "lambda"],
    ["Visualization", "visualization"],
    ["Social", "social"],
    ["DB Connectors", "db_connector"],
  ])("maps the picker label %s to the API value %s", (label, apiValue) => {
    expect(CATEGORY_MAP[label]).toBe(apiValue);
  });

  it("has no labels beyond the eight the picker shows", () => {
    expect(Object.keys(CATEGORY_MAP)).toHaveLength(8);
  });

  it("maps every label to a distinct API value so the mapping can be reversed", () => {
    const values = Object.values(CATEGORY_MAP);
    expect(new Set(values).size).toBe(values.length);
  });

  it.each(Object.entries(CATEGORY_MAP))("%s -> %s uses a lower snake_case API value", (_label, apiValue) => {
    expect(apiValue).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it.each(Object.keys(CATEGORY_MAP))("label %s is trimmed and starts with a capital", (label) => {
    expect(label).toBe(label.trim());
    expect(label).toMatch(/^[A-Z]/);
  });
});

describe("WidgetTemplate", () => {
  it("describes a client-only template without compute fields", () => {
    const template: WidgetTemplate = {
      name: "Tools",
      emoji: "🛠",
      description: "Utility tool",
      html: '<div id="app"></div>',
      css: "body { margin: 0; }",
      js: 'document.getElementById("app").textContent = "hi";',
    };
    expect(template.compute).toBeUndefined();
    expect(template.computeLanguage).toBeUndefined();
    expect(Object.keys(template).sort()).toEqual(["css", "description", "emoji", "html", "js", "name"]);
  });

  it("describes a template with server-side compute code", () => {
    const template: WidgetTemplate = {
      name: "Lambda",
      emoji: "⚡",
      description: "Serverless function",
      html: "<pre id='result'></pre>",
      css: "",
      js: "",
      compute: "print('hi')",
      computeLanguage: "python",
    };
    expect(template.computeLanguage).toBe("python");
    expect(template.compute).toContain("print");
  });
});
