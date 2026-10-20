/**
 * Tests for /verify page
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import axios from "axios";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
jest.mock("axios");
const mockedApi = api as jest.Mocked<typeof api>;

let mockToken: string | null = "valid-token";
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => key === "token" ? mockToken : null,
  }),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import VerifyPage from "@/app/verify/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockToken = "valid-token";
  (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
});

describe("VerifyPage", () => {
  it("shows loading state initially", () => {
    mockedApi.get.mockReturnValue(new Promise(() => {}));
    render(<VerifyPage />);
    expect(screen.getByText("Verifying your email...")).toBeInTheDocument();
  });

  it("shows success message on valid token", async () => {
    mockedApi.get.mockResolvedValue({ data: { message: "Email verified successfully" } });
    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText("Email verified successfully")).toBeInTheDocument();
      expect(screen.getByText("Go to Login")).toBeInTheDocument();
      expect(localStorage.getItem("email_verified")).toBe("true");
    });
  });

  it("shows error on invalid token", async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    mockedApi.get.mockRejectedValue({
      response: { data: { detail: "Invalid verification token" } },
    });
    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText("Invalid verification token")).toBeInTheDocument();
      expect(screen.getByText("Back to Login")).toBeInTheDocument();
    });
  });

  it("shows error on expired token", async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    mockedApi.get.mockRejectedValue({
      response: { data: { detail: "Verification token has expired. Please request a new one." } },
    });
    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });

  it("shows error when no token provided", async () => {
    mockToken = null;
    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText("No verification token provided.")).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
    mockedApi.get.mockRejectedValue(new Error("Network error"));
    render(<VerifyPage />);

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
    });
  });

  it("calls verify endpoint with token", async () => {
    mockedApi.get.mockResolvedValue({ data: { message: "OK" } });
    render(<VerifyPage />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/auth/verify"),
        expect.objectContaining({ params: { token: "valid-token" } })
      );
    });
  });
});
