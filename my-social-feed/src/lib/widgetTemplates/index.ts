// Public API for widget templates. Preserves the original import path
// `@/lib/widgetTemplates` — consumers don't need to know about the split.

import { CATEGORY_MAP, WidgetTemplate } from "./types";
import { CATEGORY_META } from "./meta";
import { MULTI_PANEL_TEMPLATES } from "./multiPanel";

// Re-export shared types + the category label ↔ enum map.
export type { WidgetTemplate };
export { CATEGORY_MAP };

/** Return the multi-panel starter template for a given category. Falls back
    to a minimal HTML/CSS/JS stub when the category is unknown. */
export function getTemplateForCategory(category: string): WidgetTemplate {
  const apiCategory = CATEGORY_MAP[category] || category;
  const meta = CATEGORY_META[apiCategory] || { emoji: "📦", description: "Widget template" };
  const displayName = Object.entries(CATEGORY_MAP).find(([, v]) => v === apiCategory)?.[0] || category;

  const multiPanel = MULTI_PANEL_TEMPLATES[apiCategory];
  if (multiPanel) {
    return {
      name: displayName,
      emoji: meta.emoji,
      description: meta.description,
      html: multiPanel.html,
      css: multiPanel.css,
      js: multiPanel.js,
      compute: multiPanel.compute,
      computeLanguage: multiPanel.computeLanguage,
    };
  }

  return {
    name: displayName,
    emoji: meta.emoji,
    description: meta.description,
    html: '<div id="app">\n  <h1>Hello Widget</h1>\n  <div id="output"></div>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\n#output { margin-top: 12px; }',
    js: '// Your code here\ndocument.getElementById("output").textContent = "Widget loaded!";',
  };
}
