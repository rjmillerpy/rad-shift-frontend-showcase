import React from "react";
import { render, screen } from "@testing-library/react";
import { LOADING_MESSAGE, BOOTSTRAP_ERROR_MESSAGE } from "@/app/amble/data/constants";

const usePhaserGameMock = jest.fn();
jest.mock("@/app/amble/hooks/usePhaserGame", () => ({
  usePhaserGame: (...args: unknown[]) => usePhaserGameMock(...args),
}));

// Import after the mock so the component picks up the mocked hook.
import AmbleGameView from "@/app/amble/ui/AmbleGameView";

beforeEach(() => {
  usePhaserGameMock.mockReset();
});

describe("AmbleGameView", () => {
  it("renders the host div for Phaser to attach to", () => {
    usePhaserGameMock.mockReturnValue({ status: "idle", error: null });
    render(<AmbleGameView />);
    expect(screen.getByTestId("amble-canvas-host")).toBeInTheDocument();
  });

  it("shows the loading overlay while the game boots", () => {
    usePhaserGameMock.mockReturnValue({ status: "loading", error: null });
    render(<AmbleGameView />);
    expect(screen.getByTestId("amble-loading").textContent).toBe(LOADING_MESSAGE);
    expect(screen.queryByTestId("amble-error")).not.toBeInTheDocument();
  });

  it("shows the error overlay when the hook reports an error", () => {
    usePhaserGameMock.mockReturnValue({ status: "error", error: "custom message" });
    render(<AmbleGameView />);
    expect(screen.getByTestId("amble-error").textContent).toBe("custom message");
    expect(screen.queryByTestId("amble-loading")).not.toBeInTheDocument();
  });

  it("falls back to the default error message when the hook returns null error", () => {
    usePhaserGameMock.mockReturnValue({ status: "error", error: null });
    render(<AmbleGameView />);
    expect(screen.getByTestId("amble-error").textContent).toBe(BOOTSTRAP_ERROR_MESSAGE);
  });

  it("shows neither overlay once the game is ready", () => {
    usePhaserGameMock.mockReturnValue({ status: "ready", error: null });
    render(<AmbleGameView />);
    expect(screen.queryByTestId("amble-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("amble-error")).not.toBeInTheDocument();
  });
});
