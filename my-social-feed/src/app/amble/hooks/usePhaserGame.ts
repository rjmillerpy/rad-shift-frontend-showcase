"use client";
import { useEffect, useState, type RefObject } from "react";
// Type-only import: erased at compile time, so Phaser itself is still only
// loaded by the dynamic import() below.
import type { Game } from "phaser";
import {
  BOOTSTRAP_ERROR_MESSAGE,
  CANVAS_BG_COLOR,
  PHASER_HEIGHT_PX,
  PHASER_WIDTH_PX,
} from "../data/constants";

export type PhaserGameStatus = "idle" | "loading" | "ready" | "error";

export type UsePhaserGameResult = {
  status: PhaserGameStatus;
  error: string | null;
};

/**
 * Owns the Phaser.Game lifecycle for the Amble feed. Phaser is dynamically
 * imported so it never runs during SSR (rule 69). The game instance is
 * destroyed on unmount (rule 71) — no lingering canvas, no leaked listeners.
 *
 * Kept intentionally small (rule 60): the hook is the *only* place a
 * Phaser.Game is created or destroyed.
 */
export function usePhaserGame(
  host: RefObject<HTMLDivElement | null>,
): UsePhaserGameResult {
  const [status, setStatus] = useState<PhaserGameStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    setStatus("loading");
    let destroyed = false;
    // Null until the dynamic import below resolves and the game is created.
    let gameInstance: Game | null = null;

    const boot = async () => {
      try {
        const [phaserModule, bootModule, ambleModule, interiorModule] = await Promise.all([
          import("phaser"),
          import("../scenes/BootScene"),
          import("../scenes/AmbleScene"),
          import("../scenes/InteriorScene"),
        ]);
        if (destroyed) return;
        // Phaser 3's ESM build exposes named exports only — no default.
        // Use the module namespace directly to access Game, AUTO, etc.
        const Phaser = phaserModule;
        // Smoother edges: enable canvas anti-aliasing and opt out of
        // pixel-art rounding (which snaps sprites to whole pixels and
        // disables interpolation), so tile edges and rail/tie diagonals
        // get sub-pixel smoothing instead of aliased steps. (Phaser 3.90
        // has no `resolution` option, so HiDPI rendering would need a
        // different approach.)
        gameInstance = new Phaser.Game({
          type: Phaser.AUTO,
          width: PHASER_WIDTH_PX,
          height: PHASER_HEIGHT_PX,
          backgroundColor: CANVAS_BG_COLOR,
          parent: container,
          physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
          scene: [bootModule.BootScene, ambleModule.AmbleScene, interiorModule.InteriorScene],
          pixelArt: false,
          antialias: true,
          antialiasGL: true,
          roundPixels: false,
          render: {
            pixelArt: false,
            antialias: true,
            antialiasGL: true,
            roundPixels: false,
          },
        });
        setStatus("ready");
      } catch (cause) {
        // Rule 14: never silently swallow — log the cause with context and
        // surface a user-friendly message.
        console.error("Amble Phaser bootstrap failed", { cause });
        setError(BOOTSTRAP_ERROR_MESSAGE);
        setStatus("error");
      }
    };

    void boot();

    return () => {
      destroyed = true;
      gameInstance?.destroy(true);
    };
  }, [host]);

  return { status, error };
}
