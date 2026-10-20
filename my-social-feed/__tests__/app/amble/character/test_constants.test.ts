import {
  CLOTHING_COLORS,
  CLOTHING_IDS,
  DEFAULT_HALF,
  GENDER_IDS,
  HAIRSTYLE_COLORS,
  HAIRSTYLE_IDS,
  PREVIEW_HEIGHT_PX,
  PREVIEW_WIDTH_PX,
  SKIN_TONE_COLORS,
  SKIN_TONE_IDS,
} from "@/app/amble/character/constants";
import { AvatarHalfSchema } from "@/app/amble/data/schema";

describe("attribute option lists", () => {
  it.each<[string, readonly string[]]>([
    ["GENDER_IDS", GENDER_IDS],
    ["SKIN_TONE_IDS", SKIN_TONE_IDS],
    ["HAIRSTYLE_IDS", HAIRSTYLE_IDS],
    ["CLOTHING_IDS", CLOTHING_IDS],
  ])("%s is non-empty and has unique entries", (_name, list) => {
    expect(list.length).toBeGreaterThan(0);
    expect(new Set(list).size).toBe(list.length);
  });
});

describe("placeholder palettes", () => {
  it.each<[string, Record<string, string>, readonly string[]]>([
    ["skin", SKIN_TONE_COLORS, SKIN_TONE_IDS],
    ["hair", HAIRSTYLE_COLORS, HAIRSTYLE_IDS],
    ["clothing", CLOTHING_COLORS, CLOTHING_IDS],
  ])("%s palette has an entry for every id", (_name, palette, ids) => {
    for (const id of ids) expect(palette[id]).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("preview canvas", () => {
  it("has positive dimensions", () => {
    expect(PREVIEW_WIDTH_PX).toBeGreaterThan(0);
    expect(PREVIEW_HEIGHT_PX).toBeGreaterThan(0);
  });
});

describe("DEFAULT_HALF", () => {
  it("validates against the wire schema", () => {
    expect(AvatarHalfSchema.safeParse(DEFAULT_HALF).success).toBe(true);
  });
});
