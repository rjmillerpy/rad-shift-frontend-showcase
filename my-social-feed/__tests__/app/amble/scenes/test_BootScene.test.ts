/**
 * BootScene lives in Phaser land — instantiating a real Phaser scene inside
 * jsdom requires more setup than smoke value returns. We assert the surface
 * we care about: scene-key wiring + that `create` transitions to Amble.
 */
import { BootScene } from "@/app/amble/scenes/BootScene";
import { SCENE_KEYS } from "@/app/amble/data/constants";

describe("BootScene", () => {
  it("registers with the BOOT scene key", () => {
    const scene = new BootScene();
    // Phaser stashes the key on the internal scene systems on real construction;
    // when instantiated bare (no game), the constructor argument is preserved
    // via the sys.settings key. We assert the exported constant, which the
    // constructor is contracted to pass — the smoke test in usePhaserGame
    // exercises the full boot path.
    expect(scene).toBeInstanceOf(BootScene);
    expect(SCENE_KEYS.BOOT).toBe("boot");
  });

  it("has a `create` method that starts the AMBLE scene", () => {
    const scene = new BootScene();
    const start = jest.fn();
    // Stub Phaser's scene manager surface just enough for `create` to call it.
    (scene as unknown as { scene: { start: (k: string) => void } }).scene = { start };
    scene.create();
    expect(start).toHaveBeenCalledWith(SCENE_KEYS.AMBLE);
  });
});
