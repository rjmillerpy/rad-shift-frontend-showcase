import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));

import AgoraSettingsPage from "@/app/settings/agora/page";

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

describe("AgoraSettingsPage", () => {
  it("shows login prompt when not authenticated", async () => {
    await act(async () => { render(<AgoraSettingsPage />); });
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it("loads and displays settings", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    await waitFor(() => {
      expect(screen.getByText("Agora Settings")).toBeInTheDocument();
      expect(screen.getByTestId("slider-posts-per-page")).toBeInTheDocument();
    });
  });

  it("adjusts posts per page slider", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    const s = screen.getByTestId("slider-posts-per-page") as HTMLInputElement;
    fireEvent.change(s, { target: { value: "30" } });
    expect(s.value).toBe("30");
  });

  it("selects sort option", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    const mostLiked = screen.getByTestId("sort-most_liked") as HTMLInputElement;
    fireEvent.click(mostLiked);
    expect(mostLiked.checked).toBe(true);
  });

  it("selects theme", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    fireEvent.click(screen.getByTestId("theme-dark"));
    expect(screen.getByTestId("theme-dark").style.border).toContain("2px");
  });

  it("toggles display options", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    const t = screen.getByTestId("toggle-show_avatars") as HTMLInputElement;
    expect(t.checked).toBe(true);
    fireEvent.click(t);
    expect(t.checked).toBe(false);
  });

  it("toggles compact mode", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    const t = screen.getByTestId("toggle-compact_mode") as HTMLInputElement;
    expect(t.checked).toBe(false);
    fireEvent.click(t);
    expect(t.checked).toBe(true);
  });

  it("saves settings via API", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText("Save Settings")); });
    expect(mockedApi.put).toHaveBeenCalledWith(
      expect.stringContaining("/profile/me/agora-settings"), expect.any(Object)
    );
  });

  it("shows saved confirmation", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText("Save Settings")); });
    await waitFor(() => { expect(screen.getByText("Settings saved!")).toBeInTheDocument(); });
  });

  it("resets to defaults", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: { posts_per_page: 40 } });
    await act(async () => { render(<AgoraSettingsPage />); });
    await waitFor(() => { expect((screen.getByTestId("slider-posts-per-page") as HTMLInputElement).value).toBe("40"); });
    await act(async () => { fireEvent.click(screen.getByText("Reset")); });
    expect((screen.getByTestId("slider-posts-per-page") as HTMLInputElement).value).toBe("20");
  });

  it("shows back link to agora", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    await act(async () => { render(<AgoraSettingsPage />); });
    await waitFor(() => {
      expect(screen.getByText(/Back to Agora/).closest("a")).toHaveAttribute("href", "/agora");
    });
  });

  it("handles save error", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockRejectedValue(new Error("fail"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => { render(<AgoraSettingsPage />); });
    await waitFor(() => expect(screen.getByText("Save Settings")).toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText("Save Settings")); });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
