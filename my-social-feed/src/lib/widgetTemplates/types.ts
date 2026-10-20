/** Shape returned by `getTemplateForCategory` — one starter template per
    widget category, with separate HTML/CSS/JS panels and optional server-
    side compute code (Python or SQL). */
export interface WidgetTemplate {
  name: string;
  emoji: string;
  description: string;
  html: string;
  css: string;
  js: string;
  compute?: string;
  computeLanguage?: string;
  /** @deprecated Use html/css/js instead */
  code?: string;
}

/** Human-readable category label → API enum value. Kept in one place so a
    change here propagates to both the picker UI and the backend contract. */
export const CATEGORY_MAP: Record<string, string> = {
  "Games": "game",
  "Tools": "tool",
  "API Connectors": "api_connector",
  "Display Modifiers": "display_modifier",
  "Lambda": "lambda",
  "Visualization": "visualization",
  "Social": "social",
  "DB Connectors": "db_connector",
};
