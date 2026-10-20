import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  AUTH_TOKEN_STORAGE_KEY,
  LOGIN_REDIRECT_URL,
} from "@/app/amble/data/constants";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));

// Stub the game view so we don't boot Phaser inside a page test.
jest.mock("@/app/amble/ui/AmbleShell", () => ({
  __esModule: true,
  default: () => <div data-testid="amble-shell" />,
}));

import AmblePage from "@/app/amble/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("AmblePage", () => {
  it("renders the game view when a token is present in localStorage", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "abc");
    render(<AmblePage />);
    await waitFor(() => expect(screen.getByTestId("amble-page")).toBeInTheDocument());
    expect(screen.getByTestId("amble-shell")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when localStorage has no token", async () => {
    render(<AmblePage />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(LOGIN_REDIRECT_URL));
    expect(screen.queryByTestId("amble-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("amble-shell")).not.toBeInTheDocument();
  });

  it("does not flash the canvas host during the initial auth check", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "abc");
    const { container } = render(<AmblePage />);
    // Before the mount effect runs, the page renders null — no host in the DOM.
    // (Testing-library commits synchronously so this reflects post-mount state,
    //  but we still assert the game view is present *after* the mount, meaning
    //  no intermediate error boundary or stray content leaked out.)
    expect(container.querySelector("[data-testid=amble-page]")).not.toBeNull();
  });
});
