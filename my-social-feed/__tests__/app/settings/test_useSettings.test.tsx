import { renderHook, act, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import { useSettings } from "@/app/settings/useSettings";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
const mockedApi = api as jest.Mocked<typeof api>;
const DEFAULTS = { size: 1, theme: "light" };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  localStorage.clear();
});

describe("useSettings", () => {
  it("doesn't load anything when logged out", async () => {
    const { result } = renderHook(() => useSettings("agora", DEFAULTS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(result.current.settings).toEqual(DEFAULTS);
  });

  it("stays loading until the user's settings arrive, never showing defaults as theirs", async () => {
    localStorage.setItem("token", "t");
    let resolve!: (v: unknown) => void;
    mockedApi.get.mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    const { result } = renderHook(() => useSettings("agora", DEFAULTS));
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    expect(result.current.loading).toBe(true);
    await act(async () => { resolve({ data: { size: 3 } }); });
    expect(result.current.loading).toBe(false);
    expect(result.current.settings.size).toBe(3);
  });

  it("loads the named document and merges it over the defaults", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: { size: 3 } });
    const { result } = renderHook(() => useSettings("agora", DEFAULTS));
    await waitFor(() => expect(result.current.settings.size).toBe(3));
    expect(mockedApi.get).toHaveBeenCalledWith("/profile/me/agora-settings");
    expect(result.current.settings).toEqual({ size: 3, theme: "light" });
  });

  it("saves, keeps the server's answer and flashes 'saved'", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockResolvedValue({ data: { size: 5 } });
    const { result } = renderHook(() => useSettings("bubble", DEFAULTS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.save());
    expect(mockedApi.put).toHaveBeenCalledWith("/profile/me/bubble-settings", DEFAULTS);
    expect(result.current.settings.size).toBe(5);
    expect(result.current.saved).toBe(true);
    await waitFor(() => expect(result.current.saved).toBe(false), { timeout: 3000 });
  });

  it("logs a failed save and stops saving", async () => {
    localStorage.setItem("token", "t");
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedApi.get.mockResolvedValue({ data: {} });
    mockedApi.put.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSettings("algo", DEFAULTS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.save());
    expect(consoleError).toHaveBeenCalledWith("Error saving %s settings:", "algo", expect.any(Error));
    expect(result.current.saving).toBe(false);
    consoleError.mockRestore();
  });

  it("resets to the defaults", async () => {
    localStorage.setItem("token", "t");
    mockedApi.get.mockResolvedValue({ data: { size: 9 } });
    const { result } = renderHook(() => useSettings("agora", DEFAULTS));
    await waitFor(() => expect(result.current.settings.size).toBe(9));
    act(() => result.current.reset());
    expect(result.current.settings).toEqual(DEFAULTS);
  });
});
