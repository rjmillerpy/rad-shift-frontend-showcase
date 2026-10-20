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

import BubbleSettingsPage from "@/app/settings/bubbles/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("BubbleSettingsPage", () => {
  it("shows login prompt when not authenticated", async () => {
    await act(async () => { render(<BubbleSettingsPage />); });
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it("loads and displays settings", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({
      data: { animation_speed: 0.4, bubble_density: 16, show_media_previews: true, show_avatars: true, auto_drill_cooldown: 2000, color_saturation: 1.0, show_connection_lines: true, custom_topics: [], hidden_topics: [], goal_prompt_enabled: true, focus_timer_enabled: true, depth_indicator_enabled: true },
    });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByText("Bubble Settings")).toBeInTheDocument();
      expect(screen.getByText("Animation & Layout")).toBeInTheDocument();
      expect(screen.getByText("Display Options")).toBeInTheDocument();
      expect(screen.getByText("Cognitive Features")).toBeInTheDocument();
    });
  });

  it("renders animation speed slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      const slider = screen.getByTestId("slider-animation-speed");
      expect(slider).toBeInTheDocument();
    });
  });

  it("renders bubble density slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("slider-bubble-density")).toBeInTheDocument();
    });
  });

  it("toggles display options", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-show_media_previews") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("toggles cognitive features", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-goal_prompt_enabled") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("saves settings via API", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    expect(mockedApi.put).toHaveBeenCalledWith(
      expect.stringContaining("/profile/me/bubble-settings"),
      expect.any(Object)
    );
  });

  it("adds and removes custom topics", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("custom-topic-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("custom-topic-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "Cooking" } });
      fireEvent.click(screen.getAllByText("Add")[0]);
    });

    expect(screen.getByTestId("topic-Cooking")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("topic-Cooking"));
    });

    expect(screen.queryByTestId("topic-Cooking")).not.toBeInTheDocument();
  });

  it("adds hidden topics", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("hidden-topic-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("hidden-topic-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "Sports" } });
      fireEvent.click(screen.getByText("Hide"));
    });

    expect(screen.getByTestId("hide-Sports")).toBeInTheDocument();
  });

  it("resets to defaults", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: { bubble_density: 24 } });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByText("24")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Reset to Defaults"));
    });

    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("shows back to bubbles link", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      const link = screen.getByText(/Back to bubbles/);
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/bubbles");
    });
  });

  it("adjusts animation speed slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const slider = screen.getByTestId("slider-animation-speed") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.8" } });
    expect(slider.value).toBe("0.8");
  });

  it("adjusts cooldown slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const slider = screen.getByTestId("slider-cooldown") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "3000" } });
    expect(slider.value).toBe("3000");
  });

  it("adjusts saturation slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const slider = screen.getByTestId("slider-saturation") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "1.5" } });
    expect(slider.value).toBe("1.5");
  });

  it("adjusts bubble density slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const slider = screen.getByTestId("slider-bubble-density") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "22" } });
    expect(slider.value).toBe("22");
  });

  it("toggles connection lines", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-show_connection_lines") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("toggles focus timer", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-focus_timer_enabled") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("toggles depth indicator", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-depth_indicator_enabled") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("toggles show avatars", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const toggle = screen.getByTestId("toggle-show_avatars") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(false);
  });

  it("adds custom topic via Enter key", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const input = screen.getByTestId("custom-topic-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "Gardening" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(screen.getByTestId("topic-Gardening")).toBeInTheDocument();
  });

  it("adds hidden topic via Enter key", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    const input = screen.getByTestId("hidden-topic-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "Politics" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(screen.getByTestId("hide-Politics")).toBeInTheDocument();
  });

  it("removes hidden topic on click", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: { hidden_topics: ["Finance"] } });

    await act(async () => { render(<BubbleSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("hide-Finance")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("hide-Finance"));
    });

    expect(screen.queryByTestId("hide-Finance")).not.toBeInTheDocument();
  });

  it("handles save error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => { render(<BubbleSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("shows saved confirmation after save", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    await waitFor(() => {
      expect(screen.getByText("Settings saved!")).toBeInTheDocument();
    });
  });

  it("ignores empty topic input", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<BubbleSettingsPage />); });

    await act(async () => {
      fireEvent.click(screen.getAllByText("Add")[0]);
    });

    expect(screen.queryByText("✕")).not.toBeInTheDocument();
  });
});
