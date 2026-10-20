"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "signup";
};

const NETWORK_ERROR_MESSAGE = "Cannot reach the server. Check that the backend is running.";
const LOGIN_FALLBACK_MESSAGE = "Login failed. Check credentials.";
const SIGNUP_FALLBACK_MESSAGE = "Signup failed. Try a different username or email.";

function resolveAuthErrorMessage(error: unknown, isLogin: boolean): string {
  const fallback = isLogin ? LOGIN_FALLBACK_MESSAGE : SIGNUP_FALLBACK_MESSAGE;
  if (!axios.isAxiosError(error)) return fallback;
  // No `response` means the request never reached the server (DNS, refused, CORS, offline).
  // Showing the credentials fallback here is misleading — the user can't fix it by retrying with different creds.
  if (!error.response) return NETWORK_ERROR_MESSAGE;
  const detail = error.response.data?.detail;
  return typeof detail === "string" && detail.length > 0 ? detail : fallback;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const isLogin = mode === "login";
  const title = isLogin ? "Login" : "Sign Up";
  const endpoint = isLogin ? "/auth/login" : "/auth/signup";

  const handleSubmit = async () => {
    try {
      const body: Record<string, string> = { username, password };
      if (!isLogin) body.email = email;

      const res = await api.post(endpoint, body);
      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        if (res.data.email_verified === false) {
          localStorage.setItem("email_verified", "false");
        } else {
          localStorage.setItem("email_verified", "true");
        }
        router.push(redirectTo || "/");
      } else {
        alert("Signup successful! Please check your email to verify your account, then login.");
        router.push("/login");
      }
    } catch (error: unknown) {
      alert(resolveAuthErrorMessage(error, isLogin));
      console.error("%s error:", title, error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>{title}</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      {!isLogin && (
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
      )}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button onClick={handleSubmit}>{title}</button>
    </div>
  );
}
