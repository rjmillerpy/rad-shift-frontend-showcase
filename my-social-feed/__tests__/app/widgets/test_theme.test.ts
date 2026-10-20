import { WIDGET_THEME } from "@/app/widgets/theme";

const COLORS = Object.entries(WIDGET_THEME);

/** WCAG 2.x relative luminance of a #rgb or #rrggbb colour. */
function luminance(hex: string): number {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? digits.replace(/./g, "$&$&") : digits;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("WIDGET_THEME", () => {
  it("defines exactly the palette slots the widget pages destructure", () => {
    expect(Object.keys(WIDGET_THEME).sort()).toEqual(["accent", "bg", "border", "card", "textPrimary", "textSecondary"]);
  });

  it.each(COLORS)("%s (%s) is a hex colour a browser accepts as an inline style", (_slot, value) => {
    expect(value).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    const el = document.createElement("div");
    el.style.color = value;
    expect(el.style.color).not.toBe("");
  });

  it("uses a different colour for every slot", () => {
    expect(new Set(COLORS.map(([, value]) => value.toLowerCase())).size).toBe(COLORS.length);
  });

  it("is a dark theme: surfaces get lighter from page to card to border", () => {
    expect(luminance(WIDGET_THEME.bg)).toBeLessThan(0.05);
    expect(luminance(WIDGET_THEME.card)).toBeGreaterThan(luminance(WIDGET_THEME.bg));
    expect(luminance(WIDGET_THEME.border)).toBeGreaterThan(luminance(WIDGET_THEME.card));
  });

  it.each([
    ["primary text on the page", WIDGET_THEME.textPrimary, WIDGET_THEME.bg],
    ["primary text on a card", WIDGET_THEME.textPrimary, WIDGET_THEME.card],
    ["secondary text on the page", WIDGET_THEME.textSecondary, WIDGET_THEME.bg],
    ["secondary text on a card", WIDGET_THEME.textSecondary, WIDGET_THEME.card],
    ["white button label on the accent", "#ffffff", WIDGET_THEME.accent],
  ])("%s meets WCAG AA contrast (4.5:1)", (_label, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("makes primary text stand out more than secondary text", () => {
    expect(contrast(WIDGET_THEME.textPrimary, WIDGET_THEME.bg)).toBeGreaterThan(
      contrast(WIDGET_THEME.textSecondary, WIDGET_THEME.bg),
    );
  });

  it("keeps the accent visible against the page and card it sits on", () => {
    expect(contrast(WIDGET_THEME.accent, WIDGET_THEME.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(WIDGET_THEME.accent, WIDGET_THEME.card)).toBeGreaterThanOrEqual(3);
  });
});
