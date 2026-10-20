import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";

beforeEach(() => { localStorage.clear(); });

describe("useAuth", () => {
  it("returns null token initially when localStorage is empty", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.token).toBeNull();
  });

  it("returns token from localStorage", () => {
    localStorage.setItem("token", "stored-token");
    const { result } = renderHook(() => useAuth());
    expect(result.current.token).toBe("stored-token");
  });

  it("login() sets token in state and localStorage", () => {
    const { result } = renderHook(() => useAuth());
    act(() => { result.current.login("new-token", true); });
    expect(result.current.token).toBe("new-token");
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(result.current.emailVerified).toBe(true);
  });

  it("logout() clears token from state and localStorage", () => {
    localStorage.setItem("token", "existing");
    const { result } = renderHook(() => useAuth());
    expect(result.current.token).toBe("existing");

    act(() => { result.current.logout(); });
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("reads emailVerified from localStorage", () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("email_verified", "false");
    const { result } = renderHook(() => useAuth());
    expect(result.current.emailVerified).toBe(false);
  });
});
