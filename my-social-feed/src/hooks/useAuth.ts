"use client";
import { useState, useEffect } from "react";

/**
 * Hook for managing auth token state.
 * Reads from localStorage on mount and provides login/logout helpers.
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    setToken(stored);
    setEmailVerified(localStorage.getItem("email_verified") !== "false");
  }, []);

  const login = (accessToken: string, verified: boolean) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("email_verified", String(verified));
    setToken(accessToken);
    setEmailVerified(verified);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email_verified");
    setToken(null);
    setEmailVerified(true);
  };

  return { token, emailVerified, login, logout };
}
