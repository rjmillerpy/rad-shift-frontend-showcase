"use client";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    // Guard against setting state after unmount if the user navigates away
    // before the verify request resolves (rule 71).
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await api.get("/auth/verify", { params: { token } });
        if (cancelled) return;
        setStatus("success");
        setMessage(res.data.message);
        // Writes the useAuth-owned flag directly. The in-memory copy in
        // useAuth() won't update until the next hook mount, but any
        // subsequent page will read the fresh value from localStorage.
        localStorage.setItem("email_verified", "true");
      } catch (error: unknown) {
        if (cancelled) return;
        setStatus("error");
        if (axios.isAxiosError(error) && error.response?.data?.detail) {
          setMessage(error.response.data.detail);
        } else {
          setMessage("Verification failed. The link may be invalid or expired.");
        }
      }
    };

    void verify();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "auto", textAlign: "center" }}>
      <h2>Email Verification</h2>

      {status === "loading" && <p>Verifying your email...</p>}

      {status === "success" && (
        <div>
          <p style={{ color: "#28a745", fontSize: "18px", fontWeight: "bold" }}>{message}</p>
          <Link href="/login" style={{ color: "#007bff" }}>
            Go to Login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <p style={{ color: "#dc3545", fontSize: "16px" }}>{message}</p>
          <Link href="/login" style={{ color: "#007bff" }}>
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

// useSearchParams must sit inside a Suspense boundary for Next to prerender
// the page shell.
export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
