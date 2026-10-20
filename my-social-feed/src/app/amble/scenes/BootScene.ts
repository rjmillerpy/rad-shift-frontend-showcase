import * as Phaser from "phaser";
import { SCENE_KEYS } from "../data/constants";

/** Placeholder for the real asset preloader that lands in Phase 1.2 (tileset
    atlases + character sprites). For now it just transitions to the world. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  create(): void {
    this.scene.start(SCENE_KEYS.AMBLE);
  }
}
