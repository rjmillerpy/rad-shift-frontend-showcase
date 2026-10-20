import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { usePhaserGame } from "@/app/amble/hooks/usePhaserGame";
import { BOOTSTRAP_ERROR_MESSAGE } from "@/app/amble/data/constants";

const destroySpy = jest.fn();
const GameConstructor = jest.fn(() => ({ destroy: destroySpy }));

jest.mock("phaser", () => {
  const inputKeyboardCodes = { W: 87, A: 65, S: 83, D: 68 };
  const cursorKeys = {
    left: { isDown: false }, right: { isDown: false },
    up: { isDown: false }, down: { isDown: false },
  };
  // Phaser 3 ships as an ES namespace — named exports, no default.
  return {
    __esModule: true,
    Game: GameConstructor,
    AUTO: 0,
    Scene: class {},
    Input: { Keyboard: { KeyCodes: inputKeyboardCodes } },
    GameObjects: { Rectangle: class {} },
    Types: { Input: { Keyboard: { CursorKeys: cursorKeys } } },
  };
});

function Harness() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { status, error } = usePhaserGame(ref);
  return (
    <div>
      <div ref={ref} data-testid="host" />
      <div data-testid="status">{status}</div>
      <div data-testid="error">{error ?? ""}</div>
    </div>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe("usePhaserGame", () => {
  it("transitions idle → loading → ready and instantiates Phaser.Game", async () => {
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("ready"));
    expect(GameConstructor).toHaveBeenCalledTimes(1);
  });

  it("destroys the game on unmount (rule 71)", async () => {
    const { unmount } = render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("ready"));
    unmount();
    expect(destroySpy).toHaveBeenCalledWith(true);
  });

  it("reports an error status when Phaser.Game construction throws", async () => {
    GameConstructor.mockImplementationOnce(() => {
      throw new Error("phaser bootstrap failed");
    });
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("error"));
    expect(screen.getByTestId("error").textContent).toBe(BOOTSTRAP_ERROR_MESSAGE);
  });

  it("does not create the game when the host ref is null on mount", async () => {
    function NullHostHarness() {
      // Ref never populated — simulates render before the host div exists.
      const ref = React.useRef<HTMLDivElement>(null);
      const { status } = usePhaserGame(ref);
      return <div data-testid="status">{status}</div>;
    }
    // Prevent React from wiring the ref — render the harness with a ref that
    // stays null by not passing it to a real element.
    render(<NullHostHarness />);
    // Give any effect a chance to run.
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId("status").textContent).toBe("idle");
  });
});
