import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DEFAULT_HALF } from "@/app/amble/character/constants";

// Stub the game view so we don't boot Phaser here.
jest.mock("@/app/amble/ui/AmbleGameView", () => ({
  __esModule: true,
  default: () => <div data-testid="amble-game-view" />,
}));

const useAvatarMock = jest.fn();
jest.mock("@/app/amble/hooks/useAvatar", () => ({
  useAvatar: () => useAvatarMock(),
}));

import AmbleShell from "@/app/amble/ui/AmbleShell";

const AVATAR = { left: DEFAULT_HALF, right: DEFAULT_HALF };

function stateFor(overrides: Partial<ReturnType<typeof baseState>>) {
  return { ...baseState(), ...overrides };
}
function baseState() {
  return {
    status: "loading" as "loading" | "missing" | "ready" | "error",
    avatar: null as typeof AVATAR | null,
    error: null as string | null,
    saving: false,
    saveAvatar: jest.fn(),
    refresh: jest.fn(),
  };
}

beforeEach(() => { useAvatarMock.mockReset(); });

describe("AmbleShell — status routing", () => {
  it.each<[string, Partial<ReturnType<typeof baseState>>, string]>([
    ["loading",  { status: "loading" }, "amble-shell-loading"],
    ["error",    { status: "error", error: "boom" }, "amble-shell-error"],
    ["missing",  { status: "missing" }, "amble-character-creator"],
  ])("renders the %s state", (_name, overrides, testid) => {
    useAvatarMock.mockReturnValue(stateFor(overrides));
    render(<AmbleShell />);
    expect(screen.getByTestId(testid)).toBeInTheDocument();
  });

  it("renders the game world + HUD when ready", () => {
    useAvatarMock.mockReturnValue(stateFor({ status: "ready", avatar: AVATAR }));
    render(<AmbleShell />);
    expect(screen.getByTestId("amble-shell-world")).toBeInTheDocument();
    expect(screen.getByTestId("amble-game-view")).toBeInTheDocument();
    expect(screen.getByTestId("amble-hud")).toBeInTheDocument();
  });
});

describe("AmbleShell — edit avatar (CHAR-06)", () => {
  it("opens the creator when HUD edit is clicked, and closes it on cancel", () => {
    useAvatarMock.mockReturnValue(stateFor({ status: "ready", avatar: AVATAR }));
    render(<AmbleShell />);
    fireEvent.click(screen.getByTestId("amble-hud-edit-avatar"));
    expect(screen.getByTestId("amble-character-creator")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("amble-creator-cancel"));
    expect(screen.queryByTestId("amble-character-creator")).not.toBeInTheDocument();
    expect(screen.getByTestId("amble-shell-world")).toBeInTheDocument();
  });

  it("closes the creator after a successful save", async () => {
    const saveAvatar = jest.fn().mockResolvedValue(undefined);
    useAvatarMock.mockReturnValue(stateFor({ status: "ready", avatar: AVATAR, saveAvatar }));
    render(<AmbleShell />);
    fireEvent.click(screen.getByTestId("amble-hud-edit-avatar"));
    fireEvent.click(screen.getByTestId("amble-creator-save"));
    await waitFor(() => expect(saveAvatar).toHaveBeenCalled());
    // Wait for the close rather than one fixed microtask tick: how many ticks
    // the save chain takes isn't something the test should depend on.
    await waitFor(() =>
      expect(screen.queryByTestId("amble-character-creator")).not.toBeInTheDocument()
    );
  });
});
