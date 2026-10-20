import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

import ChronicleSettingsPage from "@/app/settings/chronicle/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("ChronicleSettingsPage", () => {
  it("shows login prompt when not authenticated", async () => {
    await act(async () => { render(<ChronicleSettingsPage />); });
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it("loads and displays default settings", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByText("Chronicle Settings")).toBeInTheDocument();
      expect(screen.getByText("Reading Experience")).toBeInTheDocument();
      expect(screen.getByText("Narrative Style")).toBeInTheDocument();
      expect(screen.getByText("Display Options")).toBeInTheDocument();
    });
  });

  it("renders font size slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    await waitFor(() => {
      const slider = screen.getByTestId("slider-font-size") as HTMLInputElement;
      expect(slider).toBeInTheDocument();
      expect(slider.value).toBe("16");
    });
  });

  it("adjusts font size slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const slider = screen.getByTestId("slider-font-size") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "20" } });
    expect(slider.value).toBe("20");
  });

  it("adjusts line height slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const slider = screen.getByTestId("slider-line-height") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "2.0" } });
    expect(slider.value).toBe("2");
  });

  it("adjusts posts per page slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const slider = screen.getByTestId("slider-posts-per-page") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "12" } });
    expect(slider.value).toBe("12");
  });

  it("adjusts cache duration slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const slider = screen.getByTestId("slider-cache-duration") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "6" } });
    expect(slider.value).toBe("6");
  });

  it("selects narrative style", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const casual = screen.getByTestId("style-casual") as HTMLInputElement;
    expect(casual.checked).toBe(false);
    fireEvent.click(casual);
    expect(casual.checked).toBe(true);
    expect((screen.getByTestId("style-literary") as HTMLInputElement).checked).toBe(false);
  });

  it("selects theme", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    fireEvent.click(screen.getByTestId("theme-dark"));

    // Dark theme button should have selected border
    expect(screen.getByTestId("theme-dark").style.border).toContain("2px");
  });

  it("toggles display options", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-show_media_inline") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("toggles title prompt", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-title_prompt_enabled") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("toggles auto advance", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-auto_advance") as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  });

  it("saves settings via API", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: { font_size: 20 } });

    await act(async () => { render(<ChronicleSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    expect(mockedApi.put).toHaveBeenCalledWith(
      expect.stringContaining("/profile/me/chronicle-settings"),
      expect.any(Object)
    );
  });

  it("shows saved confirmation", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    await waitFor(() => {
      expect(screen.getByText("Settings saved!")).toBeInTheDocument();
    });
  });

  it("resets to defaults", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: { font_size: 22 } });

    await act(async () => { render(<ChronicleSettingsPage />); });

    await waitFor(() => {
      expect((screen.getByTestId("slider-font-size") as HTMLInputElement).value).toBe("22");
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Reset to Defaults"));
    });

    expect((screen.getByTestId("slider-font-size") as HTMLInputElement).value).toBe("16");
  });

  it("handles save error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockRejectedValue(new Error("fail"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => { render(<ChronicleSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("shows back to chronicle link", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<ChronicleSettingsPage />); });

    await waitFor(() => {
      const link = screen.getByText(/Back to chronicle/);
      expect(link.closest("a")).toHaveAttribute("href", "/chronicle");
    });
  });
});
