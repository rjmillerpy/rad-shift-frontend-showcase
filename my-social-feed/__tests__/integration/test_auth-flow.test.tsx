/**
 * Integration test: authentication flow across AuthForm → login/signup pages.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

import LoginPage from "@/app/login/page";
import SignupPage from "@/app/signup/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Auth flow integration", () => {
  it("signup → redirect to login → login → token stored → redirect to home", async () => {
    // Step 1: Signup
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    const { unmount: unmountSignup } = render(<SignupPage />);

    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Email"), "newuser@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "securepass123");
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("check your email"));
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    unmountSignup();
    mockPush.mockClear();

    // Step 2: Login
    mockedApi.post.mockResolvedValueOnce({ data: { access_token: "jwt-token-abc" } });

    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "securepass123");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("jwt-token-abc");
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("signup failure shows alert and does not redirect", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("400"));

    render(<SignupPage />);

    await userEvent.type(screen.getByPlaceholderText("Username"), "existing");
    await userEvent.type(screen.getByPlaceholderText("Email"), "existing@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Signup failed"));
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("login failure shows alert and does not store token", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("401"));

    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("Username"), "wrong");
    await userEvent.type(screen.getByPlaceholderText("Password"), "badpass");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Login failed. Check credentials.");
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  it("login and signup pages render correct form fields", () => {
    const { unmount } = render(<LoginPage />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    unmount();

    render(<SignupPage />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });
});
