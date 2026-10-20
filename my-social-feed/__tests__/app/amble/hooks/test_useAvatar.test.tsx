import { renderHook, act, waitFor } from "@testing-library/react";
import { useAvatar } from "@/app/amble/hooks/useAvatar";
import { DEFAULT_HALF } from "@/app/amble/character/constants";

const ambleGetMock = jest.fn();
const amblePutMock = jest.fn();
jest.mock("@/app/amble/lib/api", () => ({
  __esModule: true,
  ambleGet: (...args: unknown[]) => ambleGetMock(...args),
  amblePut: (...args: unknown[]) => amblePutMock(...args),
  amblePost: jest.fn(),
  AmbleApiError: class extends Error {},
}));

const AVATAR = { left: DEFAULT_HALF, right: DEFAULT_HALF };

beforeEach(() => {
  ambleGetMock.mockReset();
  amblePutMock.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe("useAvatar — initial load", () => {
  it("transitions loading → missing when exists=false", async () => {
    ambleGetMock.mockResolvedValueOnce({ avatar: null, exists: false });
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("missing"));
    expect(result.current.avatar).toBeNull();
  });

  it("transitions loading → ready when the backend returns an avatar", async () => {
    ambleGetMock.mockResolvedValueOnce({ avatar: AVATAR, exists: true });
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.avatar).toEqual(AVATAR);
  });

  it("transitions loading → error and sets a user-safe message on GET failure", async () => {
    ambleGetMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/load/i);
  });

  it("treats a schema-invalid GET payload as an error", async () => {
    ambleGetMock.mockResolvedValueOnce({ garbage: true });
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});

describe("useAvatar — saveAvatar", () => {
  it("PUTs the payload and moves the hook into ready", async () => {
    ambleGetMock.mockResolvedValueOnce({ avatar: null, exists: false });
    amblePutMock.mockResolvedValueOnce({ avatar: AVATAR, exists: true });
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("missing"));
    await act(async () => { await result.current.saveAvatar(AVATAR); });
    expect(amblePutMock).toHaveBeenCalledWith("/amble/avatar", { avatar: AVATAR });
    expect(result.current.status).toBe("ready");
    expect(result.current.avatar).toEqual(AVATAR);
  });

  it("sets saving=true during the PUT and false after", async () => {
    ambleGetMock.mockResolvedValueOnce({ avatar: null, exists: false });
    let resolvePut: ((v: unknown) => void) | null = null;
    amblePutMock.mockImplementationOnce(() => new Promise((r) => { resolvePut = r; }));
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("missing"));
    let promise: Promise<void> | undefined;
    act(() => { promise = result.current.saveAvatar(AVATAR); });
    await waitFor(() => expect(result.current.saving).toBe(true));
    await act(async () => {
      resolvePut?.({ avatar: AVATAR, exists: true });
      await promise;
    });
    expect(result.current.saving).toBe(false);
  });

  it("sets an error message when the PUT fails", async () => {
    ambleGetMock.mockResolvedValueOnce({ avatar: null, exists: false });
    amblePutMock.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("missing"));
    await act(async () => { await result.current.saveAvatar(AVATAR); });
    expect(result.current.error).toMatch(/save/i);
  });

  it("refuses invalid payloads at the boundary (rule 5) and does not PUT", async () => {
    ambleGetMock.mockResolvedValueOnce({ avatar: null, exists: false });
    const { result } = renderHook(() => useAvatar());
    await waitFor(() => expect(result.current.status).toBe("missing"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await act(async () => { await result.current.saveAvatar({ garbage: 1 } as any); });
    expect(amblePutMock).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/invalid/i);
  });
});
