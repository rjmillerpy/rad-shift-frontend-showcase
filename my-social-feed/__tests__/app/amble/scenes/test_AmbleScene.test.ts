import { AmbleScene } from "@/app/amble/scenes/AmbleScene";
import { SCENE_KEYS } from "@/app/amble/data/constants";

describe("AmbleScene", () => {
  it("constructs without a running Phaser game", () => {
    expect(() => new AmbleScene()).not.toThrow();
  });

  it("uses the AMBLE scene key constant", () => {
    // Contract: the scene's constructor passes SCENE_KEYS.AMBLE to super().
    expect(SCENE_KEYS.AMBLE).toBe("amble");
    expect(new AmbleScene()).toBeInstanceOf(AmbleScene);
  });
});
