"use client";
import React, { useState } from "react";
import api from "@/lib/api";

export default function EmailVerificationBanner() {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      alert("Verification email sent! Please check your inbox.");
    } catch (e) {
      console.error("Error resending verification:", e);
      alert("Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff3cd",
        border: "1px solid #ffc107",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "14px", color: "#856404" }}>
        Please verify your email to post, like, and interact.
      </span>
      <button
        onClick={handleResend}
        disabled={resending}
        style={{
          padding: "6px 12px",
          backgroundColor: "#ffc107",
          color: "#856404",
          border: "none",
          borderRadius: "4px",
          cursor: resending ? "wait" : "pointer",
          fontWeight: "bold",
          fontSize: "13px",
        }}
      >
        {resending ? "Sending..." : "Resend verification email"}
      </button>
    </div>
  );
}
