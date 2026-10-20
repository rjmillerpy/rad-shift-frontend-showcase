/**
 * Tests for FloatingButtons shared component
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import FloatingButtons from "@/components/FloatingButtons";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("FloatingButtons", () => {
  describe("when logged out", () => {
    it("shows Log in link", () => {
      render(<FloatingButtons />);
      const loginLink = screen.getByText("Log in");
      expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
    });

    it("does not show profile picture", () => {
      render(<FloatingButtons />);
      expect(screen.queryByAltText("Your profile")).not.toBeInTheDocument();
    });

    it("shows search button", () => {
      render(<FloatingButtons />);
      expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("does not show new post button", () => {
      render(<FloatingButtons />);
      expect(screen.queryByRole("button", { name: "New post" })).not.toBeInTheDocument();
    });

    it("search button navigates to /search", () => {
      render(<FloatingButtons />);
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(mockPush).toHaveBeenCalledWith("/search");
    });
  });

  describe("when logged in", () => {
    beforeEach(() => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
    });

    it("shows profile picture", async () => {
      render(<FloatingButtons />);
      await waitFor(() => {
        expect(screen.getByAltText("Your profile")).toBeInTheDocument();
      });
    });

    it("profile picture navigates to /profile", async () => {
      render(<FloatingButtons />);
      fireEvent.click(screen.getByAltText("Your profile"));
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });

    it("shows search button", async () => {
      render(<FloatingButtons />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
      });
    });

    it("shows new post button", async () => {
      render(<FloatingButtons />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "New post" })).toBeInTheDocument();
      });
    });

    it("new post button opens composer modal", async () => {
      render(<FloatingButtons />);
      fireEvent.click(screen.getByRole("button", { name: "New post" }));

      expect(screen.getByText("Create Post")).toBeInTheDocument();
    });

    it("composer modal can be closed", async () => {
      render(<FloatingButtons />);
      fireEvent.click(screen.getByRole("button", { name: "New post" }));

      fireEvent.click(screen.getByRole("button", { name: "Close composer" }));
      expect(screen.queryByText("Create Post")).not.toBeInTheDocument();
    });

    it("does not show Log in link", async () => {
      render(<FloatingButtons />);
      await waitFor(() => {
        expect(screen.queryByText("Log in")).not.toBeInTheDocument();
      });
    });

    it("hides composer when hideComposer is true", async () => {
      render(<FloatingButtons hideComposer />);
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "New post" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
      });
    });

    it("profile picture uses polygon clip-path", async () => {
      render(<FloatingButtons />);
      await waitFor(() => {
        const img = screen.getByAltText("Your profile");
        expect(img.style.clipPath).toContain("polygon");
      });
    });

    it("handles profile fetch error silently", async () => {
      mockedApi.get.mockRejectedValue(new Error("Network error"));
      render(<FloatingButtons />);
      // Should not crash
      await waitFor(() => {
        expect(screen.getByAltText("Your profile")).toBeInTheDocument();
      });
    });

    it("fetches and displays custom profile picture", async () => {
      mockedApi.get.mockResolvedValue({
        data: { profile_picture_url: "https://example.com/pic.jpg" },
      });
      render(<FloatingButtons />);
      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith(
          expect.stringContaining("/profile/me")
        );
      });
    });
  });

  describe("settings gear button", () => {
    it("shows settings gear when logged in", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons />);
      expect(screen.getByTestId("settings-gear-btn")).toBeInTheDocument();
    });

    it("does not show settings gear when not logged in", () => {
      render(<FloatingButtons />);
      expect(screen.queryByTestId("settings-gear-btn")).not.toBeInTheDocument();
    });

    it("expands to show algo settings button on click", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons />);

      fireEvent.click(screen.getByTestId("settings-gear-btn"));

      expect(screen.getByTestId("settings-algo-btn")).toBeInTheDocument();
    });

    it("shows feed settings button when feedSettingsPath is provided", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons feedSettingsPath="/settings/bubbles" />);

      fireEvent.click(screen.getByTestId("settings-gear-btn"));

      expect(screen.getByTestId("settings-feed-btn")).toBeInTheDocument();
    });

    it("does not show feed settings button without feedSettingsPath", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons />);

      fireEvent.click(screen.getByTestId("settings-gear-btn"));

      expect(screen.queryByTestId("settings-feed-btn")).not.toBeInTheDocument();
    });

    it("navigates to algo settings on click", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons />);

      fireEvent.click(screen.getByTestId("settings-gear-btn"));
      fireEvent.click(screen.getByTestId("settings-algo-btn"));

      expect(mockPush).toHaveBeenCalledWith("/settings/algo");
    });

    it("navigates to feed settings on click", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons feedSettingsPath="/settings/bubbles" />);

      fireEvent.click(screen.getByTestId("settings-gear-btn"));
      fireEvent.click(screen.getByTestId("settings-feed-btn"));

      expect(mockPush).toHaveBeenCalledWith("/settings/bubbles");
    });

    it("collapses on second gear click", () => {
      localStorage.setItem("token", "test-token");
      mockedApi.get.mockResolvedValue({ data: { profile_picture_url: null } });
      render(<FloatingButtons />);

      fireEvent.click(screen.getByTestId("settings-gear-btn"));
      expect(screen.getByTestId("settings-algo-btn")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("settings-gear-btn"));
      expect(screen.queryByTestId("settings-algo-btn")).not.toBeInTheDocument();
    });
  });
});
