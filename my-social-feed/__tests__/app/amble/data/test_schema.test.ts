import {
  AvatarHalfSchema,
  AvatarResponseSchema,
  AvatarSchema,
  AvatarUpdateRequestSchema,
  EntityBindingSchema,
  EntityConfigSchema,
  MapManifestSchema,
} from "@/app/amble/data/schema";

const validHalf = {
  gender: "boy" as const,
  skin_tone: "warm",
  hairstyle: "short",
  clothing: "hoodie",
};
const validAvatar = { left: validHalf, right: { ...validHalf, gender: "girl" as const } };

describe("AvatarHalfSchema", () => {
  it("accepts a well-formed half", () => {
    expect(AvatarHalfSchema.parse(validHalf)).toEqual(validHalf);
  });

  it.each<[string, unknown]>([
    ["missing gender",   { ...validHalf, gender: undefined }],
    ["wrong gender",     { ...validHalf, gender: "other" }],
    ["empty skin_tone",   { ...validHalf, skin_tone: "" }],
    ["oversized skin_tone", { ...validHalf, skin_tone: "x".repeat(33) }],
    ["empty hairstyle",  { ...validHalf, hairstyle: "" }],
    ["empty clothing",   { ...validHalf, clothing: "" }],
  ])("rejects: %s", (_name, payload) => {
    expect(AvatarHalfSchema.safeParse(payload).success).toBe(false);
  });
});

describe("AvatarSchema", () => {
  it("accepts a valid avatar", () => {
    expect(AvatarSchema.parse(validAvatar)).toEqual(validAvatar);
  });

  it("rejects when a side is missing", () => {
    expect(AvatarSchema.safeParse({ left: validHalf }).success).toBe(false);
  });
});

describe("AvatarResponseSchema", () => {
  it("accepts null avatar with exists=false (first visit)", () => {
    expect(AvatarResponseSchema.parse({ avatar: null, exists: false }).exists).toBe(false);
  });

  it("accepts an existing avatar", () => {
    const parsed = AvatarResponseSchema.parse({ avatar: validAvatar, exists: true });
    expect(parsed.avatar).toEqual(validAvatar);
  });
});

describe("AvatarUpdateRequestSchema", () => {
  it("requires a full avatar payload", () => {
    expect(AvatarUpdateRequestSchema.safeParse({}).success).toBe(false);
    expect(AvatarUpdateRequestSchema.safeParse({ avatar: validAvatar }).success).toBe(true);
  });
});

describe("EntityBindingSchema", () => {
  it.each<[string, unknown, boolean]>([
    ["persistent-identity ok", { kind: "persistent-identity", usernames: ["alice"], weight: 0.8 }, true],
    ["category ok",            { kind: "category", categories: ["music"], weight: 0.5 }, true],
    ["blended ok",             { kind: "blended", parts: [{ kind: "category", categories: ["a"], weight: 1 }] }, true],
    ["empty usernames",        { kind: "persistent-identity", usernames: [], weight: 0.5 }, false],
    ["weight over 1",          { kind: "category", categories: ["a"], weight: 1.5 }, false],
    ["unknown kind",           { kind: "chaos", weight: 0.5 }, false],
    ["blended empty parts",    { kind: "blended", parts: [] }, false],
  ])("%s", (_name, payload, ok) => {
    expect(EntityBindingSchema.safeParse(payload).success).toBe(ok);
  });
});

const validEntity = {
  id: "npc_alice",
  type: "npc" as const,
  position: { tileX: 5, tileY: 12 },
  binding: { kind: "persistent-identity" as const, usernames: ["alice"], weight: 1 },
};

describe("EntityConfigSchema", () => {
  it("accepts a minimal valid entity", () => {
    expect(EntityConfigSchema.parse(validEntity).id).toBe("npc_alice");
  });

  it.each<[string, unknown]>([
    ["empty id",           { ...validEntity, id: "" }],
    ["bad type",           { ...validEntity, type: "wizard" }],
    ["non-integer tileX",  { ...validEntity, position: { tileX: 1.5, tileY: 0 } }],
    ["missing binding",    { ...validEntity, binding: undefined }],
  ])("rejects: %s", (_name, payload) => {
    expect(EntityConfigSchema.safeParse(payload).success).toBe(false);
  });
});

describe("MapManifestSchema", () => {
  const validAnchor = {
    id: "sign_welcome",
    type: "sign" as const,
    position: { tileX: 1, tileY: 1 },
  };
  const validMap = {
    id: "demo-town",
    width: 4,
    height: 3,
    tileWidth: 16,
    tileHeight: 16,
    tilesetRefs: ["ground.png"],
    cameraBounds: { x: 0, y: 0, width: 1024, height: 768 },
    layers: {
      ground: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      collision: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    },
    entities: [validAnchor],
  };

  it("accepts a valid manifest", () => {
    expect(MapManifestSchema.parse(validMap).id).toBe("demo-town");
  });

  it("defaults tilesetRefs to an empty array when omitted", () => {
    const { tilesetRefs, ...rest } = validMap;
    void tilesetRefs;
    expect(MapManifestSchema.parse(rest).tilesetRefs).toEqual([]);
  });

  it.each<[string, unknown]>([
    ["empty id",            { ...validMap, id: "" }],
    ["zero tileWidth",      { ...validMap, tileWidth: 0 }],
    ["negative tileHeight", { ...validMap, tileHeight: -1 }],
    ["negative bounds",     { ...validMap, cameraBounds: { x: 0, y: 0, width: -1, height: 1 } }],
    ["missing collision",   { ...validMap, layers: { ground: validMap.layers.ground } }],
    ["collision has 2s",    { ...validMap, layers: { ...validMap.layers, collision: [[2]] } }],
    ["negative width",      { ...validMap, width: -1 }],
    ["negative height",     { ...validMap, height: 0 }],
  ])("rejects: %s", (_name, payload) => {
    expect(MapManifestSchema.safeParse(payload).success).toBe(false);
  });
});
