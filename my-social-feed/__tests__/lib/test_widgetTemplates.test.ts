import { getTemplateForCategory, CATEGORY_MAP } from "@/lib/widgetTemplates";

describe("widgetTemplates", () => {
  it("CATEGORY_MAP has all 8 categories", () => {
    expect(Object.keys(CATEGORY_MAP)).toHaveLength(8);
  });

  it.each(Object.entries(CATEGORY_MAP))("generates template for %s category", (displayName) => {
    const template = getTemplateForCategory(displayName);
    expect(template.name).toBeTruthy();
    expect(template.emoji).toBeTruthy();
    expect(template.html.length).toBeGreaterThan(10);
    expect(template.js.length).toBeGreaterThan(10);
  });

  it("generates different content for different categories", () => {
    const game = getTemplateForCategory("Games");
    const tool = getTemplateForCategory("Tools");
    expect(game.js).not.toBe(tool.js);
    expect(game.html).not.toBe(tool.html);
  });

  it("template has all required fields", () => {
    const template = getTemplateForCategory("Tools");
    expect(template).toHaveProperty("name");
    expect(template).toHaveProperty("emoji");
    expect(template).toHaveProperty("description");
    expect(template).toHaveProperty("html");
    expect(template).toHaveProperty("css");
    expect(template).toHaveProperty("js");
  });

  it("Lambda template includes compute panel", () => {
    const template = getTemplateForCategory("Lambda");
    expect(template.compute).toBeTruthy();
    expect(template.computeLanguage).toBe("python");
  });

  it("DB Connectors template includes compute panel", () => {
    const template = getTemplateForCategory("DB Connectors");
    expect(template.compute).toBeTruthy();
    expect(template.computeLanguage).toBe("sql");
  });

  it("Games template does not include compute panel", () => {
    const template = getTemplateForCategory("Games");
    expect(template.compute).toBeUndefined();
  });
});
