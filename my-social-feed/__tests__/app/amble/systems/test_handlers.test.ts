import {
  resolveDialogue,
  registerHandler,
  registerTypeHandler,
} from "@/app/amble/systems/handlers";
import type { EntityAnchor } from "@/app/amble/data/schema";

const anchor = (id: string, type: EntityAnchor["type"] = "npc"): EntityAnchor => ({
  id,
  type,
  position: { tileX: 0, tileY: 0 },
});

describe("resolveDialogue", () => {
  it("returns the NAV-02 'coming soon' line for the train station", () => {
    const line = resolveDialogue(anchor("train-station", "building"));
    expect(line.speaker).toBe("Station Attendant");
    expect(line.text).toMatch(/not running yet/i);
  });

  it("falls back to a per-type handler when no id-specific one is registered", () => {
    expect(resolveDialogue(anchor("some-npc", "npc")).text).toMatch(/keep walking/i);
    expect(resolveDialogue(anchor("some-sign", "sign")).text).toMatch(/faded/i);
    expect(resolveDialogue(anchor("some-building", "building")).text).toMatch(/locked/i);
    expect(resolveDialogue(anchor("some-object", "object")).text).toMatch(/bench/i);
  });

  it("lets a caller register a new id-specific handler at runtime", () => {
    registerHandler("secret-shopkeeper", () => ({
      speaker: "Shopkeeper",
      text: "Welcome in!",
    }));
    const line = resolveDialogue(anchor("secret-shopkeeper", "npc"));
    expect(line.speaker).toBe("Shopkeeper");
    expect(line.text).toBe("Welcome in!");
  });

  it("id-specific handler beats type handler", () => {
    registerTypeHandler("object", () => ({ speaker: "T", text: "type" }));
    registerHandler("special-object", () => ({ speaker: "S", text: "special" }));
    expect(resolveDialogue(anchor("special-object", "object")).text).toBe("special");
  });
});
