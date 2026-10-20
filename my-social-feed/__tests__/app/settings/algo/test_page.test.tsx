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

import AlgoSettingsPage from "@/app/settings/algo/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("AlgoSettingsPage", () => {
  it("keeps the same slider element while it's dragged (it used to be remounted on every change)", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AlgoSettingsPage />); });
    const slider = await screen.findByTestId("slider-recency_weight");
    fireEvent.change(slider, { target: { value: "0.5" } });
    fireEvent.change(screen.getByTestId("slider-recency_weight"), { target: { value: "0.7" } });
    expect(screen.getByTestId("slider-recency_weight")).toBe(slider);
    expect(slider).toHaveValue("0.7");
  });

  it("shows login prompt when not authenticated", async () => {
    await act(async () => { render(<AlgoSettingsPage />); });
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it("loads and displays default settings", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({
      data: { like_weight: 1.0, repost_weight: 1.0, share_weight: 1.0, laugh_weight: 0.5, save_weight: 0.5, recency_weight: 0.3, randomness: 0.1, interest_adaptation: 0.5, category_diversity: 0.5, show_followed_boost: true, hide_seen_posts: false, preferred_categories: [], blocked_categories: [] },
    });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByText("Algorithm Settings")).toBeInTheDocument();
      expect(screen.getByText("Engagement Weights")).toBeInTheDocument();
      expect(screen.getByText("Likes")).toBeInTheDocument();
      expect(screen.getByText("Reposts")).toBeInTheDocument();
      expect(screen.getByText("Laughs")).toBeInTheDocument();
    });
  });

  it("renders sliders for all weights", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("slider-like_weight")).toBeInTheDocument();
      expect(screen.getByTestId("slider-repost_weight")).toBeInTheDocument();
      expect(screen.getByTestId("slider-laugh_weight")).toBeInTheDocument();
      expect(screen.getByTestId("slider-recency_weight")).toBeInTheDocument();
      expect(screen.getByTestId("slider-randomness")).toBeInTheDocument();
    });
  });

  it("adjusts slider value", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    const slider = screen.getByTestId("slider-like_weight") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "1.5" } });
    expect(slider.value).toBe("1.5");
  });

  it("toggles checkboxes", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    const followedBoost = screen.getByTestId("toggle-followed-boost") as HTMLInputElement;
    expect(followedBoost.checked).toBe(true);
    fireEvent.click(followedBoost);
    expect(followedBoost.checked).toBe(false);
  });

  it("saves settings via API", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: { like_weight: 1.5 } });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByText("Save Settings")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    expect(mockedApi.put).toHaveBeenCalledWith(
      expect.stringContaining("/profile/me/algo-settings"),
      expect.any(Object)
    );
  });

  it("resets to defaults", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: { like_weight: 1.8 } });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      const slider = screen.getByTestId("slider-like_weight") as HTMLInputElement;
      expect(slider.value).toBe("1.8");
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Reset to Defaults"));
    });

    const slider = screen.getByTestId("slider-like_weight") as HTMLInputElement;
    expect(slider.value).toBe("1");
  });

  it("adds and removes preferred categories", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("preferred-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("preferred-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "music" } });
      fireEvent.click(screen.getAllByText("Add")[0]);
    });

    expect(screen.getByTestId("pref-music")).toBeInTheDocument();

    // Remove it
    await act(async () => {
      fireEvent.click(screen.getByTestId("pref-music"));
    });

    expect(screen.queryByTestId("pref-music")).not.toBeInTheDocument();
  });

  it("adds blocked categories", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("blocked-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("blocked-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "politics" } });
      fireEvent.click(screen.getByText("Block"));
    });

    expect(screen.getByTestId("block-politics")).toBeInTheDocument();
  });

  it("shows saved confirmation", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    await waitFor(() => {
      expect(screen.getByText("Settings saved!")).toBeInTheDocument();
    });
  });

  it("handles save error gracefully", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => { render(<AlgoSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Settings"));
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("toggles hide seen posts checkbox", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    const toggle = screen.getByTestId("toggle-hide-seen") as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  });

  it("adds preferred category via Enter key", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("preferred-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("preferred-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "art" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(screen.getByTestId("pref-art")).toBeInTheDocument();
  });

  it("adds blocked category via Enter key", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("blocked-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("blocked-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "spam" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(screen.getByTestId("block-spam")).toBeInTheDocument();
  });

  it("removes blocked category on click", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: { blocked_categories: ["politics"] } });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("block-politics")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("block-politics"));
    });

    expect(screen.queryByTestId("block-politics")).not.toBeInTheDocument();
  });

  it("renders slop filter radio buttons", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("slop-filter-hide")).toBeInTheDocument();
      expect(screen.getByTestId("slop-filter-dim")).toBeInTheDocument();
      expect(screen.getByTestId("slop-filter-show")).toBeInTheDocument();
      // Default is "hide"
      expect((screen.getByTestId("slop-filter-hide") as HTMLInputElement).checked).toBe(true);
    });
  });

  it("changes slop filter to show", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    const showRadio = screen.getByTestId("slop-filter-show") as HTMLInputElement;
    fireEvent.click(showRadio);
    expect(showRadio.checked).toBe(true);
    expect((screen.getByTestId("slop-filter-hide") as HTMLInputElement).checked).toBe(false);
  });

  it("adjusts slop threshold slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    const slider = screen.getByTestId("slider-slop-threshold") as HTMLInputElement;
    expect(slider.value).toBe("0");
    fireEvent.change(slider, { target: { value: "5" } });
    expect(slider.value).toBe("5");
  });

  it("ignores empty category input", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("preferred-input")).toBeInTheDocument();
    });

    // Try adding empty
    await act(async () => {
      fireEvent.click(screen.getAllByText("Add")[0]);
    });

    // No tag chips should appear
    expect(screen.queryByText("✕")).not.toBeInTheDocument();
  });

  it("renders engagement enabled toggle defaulting to on", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      const toggle = screen.getByTestId("toggle-engagement-enabled") as HTMLInputElement;
      expect(toggle.checked).toBe(true);
    });
  });

  it("hides weight sliders when engagement is disabled", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.getByTestId("slider-like_weight")).toBeInTheDocument();
    });

    // Disable engagement
    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle-engagement-enabled"));
    });

    expect(screen.queryByTestId("slider-like_weight")).not.toBeInTheDocument();
    expect(screen.queryByTestId("slider-slop_weight")).not.toBeInTheDocument();
    expect(screen.getByText(/ordered by recency only/i)).toBeInTheDocument();
  });

  it("shows weight sliders when engagement is re-enabled", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: { engagement_enabled: false } });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.queryByTestId("slider-like_weight")).not.toBeInTheDocument();
    });

    // Re-enable
    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle-engagement-enabled"));
    });

    expect(screen.getByTestId("slider-like_weight")).toBeInTheDocument();
    expect(screen.getByTestId("slider-slop_weight")).toBeInTheDocument();
  });

  it("renders slop weight slider defaulting to 0", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      const slopSlider = screen.getByTestId("slider-slop_weight") as HTMLInputElement;
      expect(slopSlider.value).toBe("0");
    });
  });

  it("adjusts slop weight slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    const slider = screen.getByTestId("slider-slop_weight") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "1.5" } });
    expect(slider.value).toBe("1.5");
  });

  it("does not render a report weight slider", async () => {
    localStorage.setItem("token", "test-token");
    mockedApi.get.mockResolvedValue({ data: {} });

    await act(async () => { render(<AlgoSettingsPage />); });

    await waitFor(() => {
      expect(screen.queryByTestId("slider-report_weight")).not.toBeInTheDocument();
    });
  });
});
