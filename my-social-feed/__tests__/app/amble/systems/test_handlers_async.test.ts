import {
  registerHandler,
  resolveInteraction,
  _resetHandlersForTests,
} from "@/app/amble/systems/handlers";
import type { EntityAnchor } from "@/app/amble/data/schema";
import { TOWN } from "@/app/amble/data/town";

// Every town has a wandering NPC with a few canned posts (data/town.ts).
const WANDERER_POSTS = TOWN.stubPosts.wanderer;

const anchor = (id: string, type: EntityAnchor["type"] = "npc"): EntityAnchor => ({
  id,
  type,
  position: { tileX: 0, tileY: 0 },
});

describe("resolveInteraction", () => {
  beforeEach(() => {
    _resetHandlersForTests();
    // Re-register the specific handlers we care about below since the
    // reset clears the module state. Type-defaults are re-registered when
    // the module is re-imported; we re-import per test file so the
    // baseline handlers are present here.
  });

  it("takes the sync id-specific line for the train station (NAV-02)", async () => {
    registerHandler("train-station", () => ({
      speaker: "Station Attendant",
      text: "Line's not running yet — check back later.",
    }));
    const result = await resolveInteraction(anchor("train-station", "building"), null);
    expect(result.kind).toBe("line");
    if (result.kind === "line") {
      expect(result.line.speaker).toBe("Station Attendant");
    }
  });

  it("falls through to INT-01 stub for a content-backed npc", async () => {
    const result = await resolveInteraction(anchor("wanderer", "npc"), null);
    expect(result.kind).toBe("posts");
    if (result.kind === "posts") {
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].author).toBe(WANDERER_POSTS[0].author);
      expect(result.nextCursor).toBe("stub:1");
    }
  });

  it("returns empty-state fallback when the stub has no corpus", async () => {
    const result = await resolveInteraction(anchor("no-such", "npc"), null);
    expect(result.kind).toBe("empty");
    if (result.kind === "empty") {
      expect(result.fallback.text).toMatch(/wave/i);
    }
  });

  it("advances the cursor when re-interacting (CONTENT-04)", async () => {
    const first = await resolveInteraction(anchor("wanderer", "npc"), null);
    if (first.kind !== "posts") throw new Error("expected posts");
    const second = await resolveInteraction(anchor("wanderer", "npc"), first.nextCursor);
    if (second.kind !== "posts") throw new Error("expected posts");
    expect(second.posts[0].author).toBe(WANDERER_POSTS[1].author);
  });
});
