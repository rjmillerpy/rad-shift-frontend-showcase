"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AmbleShell from "./ui/AmbleShell";
import { AUTH_TOKEN_STORAGE_KEY, LOGIN_REDIRECT_URL } from "./data/constants";

const PAGE_BG_COLOR = "#1a1a2e";

type AuthState = "checking" | "authed" | "redirecting";

export default function AmblePage() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>("checking");

  // Read localStorage directly on mount rather than depending on useAuth's
  // async token load — otherwise the first render sees token === null and
  // redirects before the shared hook has a chance to populate it.
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (stored === null) {
      router.replace(LOGIN_REDIRECT_URL);
      setState("redirecting");
      return;
    }
    setState("authed");
  }, [router]);

  // Render nothing while we're checking or redirecting so unauthed visitors
  // never see a flash of the canvas host.
  if (state !== "authed") return null;

  return (
    <div
      data-testid="amble-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PAGE_BG_COLOR,
      }}
    >
      <AmbleShell />
    </div>
  );
}
