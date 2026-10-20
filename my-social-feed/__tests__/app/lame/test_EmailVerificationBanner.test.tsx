import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";
import EmailVerificationBanner from "@/app/lame/EmailVerificationBanner";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

let alertSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
  errorSpy.mockRestore();
});

const resendButton = () => screen.getByRole("button");

describe("EmailVerificationBanner", () => {
  it("asks the user to verify and offers to resend, without calling the API", () => {
    render(<EmailVerificationBanner />);
    expect(screen.getByText("Please verify your email to post, like, and interact.")).toBeInTheDocument();
    expect(resendButton()).toHaveTextContent("Resend verification email");
    expect(resendButton()).toBeEnabled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("requests a new email and confirms it was sent", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    render(<EmailVerificationBanner />);
    await act(async () => { fireEvent.click(resendButton()); });

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/resend-verification");
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith("Verification email sent! Please check your inbox.");
    expect(resendButton()).toBeEnabled();
    expect(resendButton()).toHaveTextContent("Resend verification email");
  });

  it("tells the user when resending fails and lets them retry", async () => {
    const failure = new Error("rate limited");
    mockedApi.post.mockRejectedValue(failure);
    render(<EmailVerificationBanner />);
    await act(async () => { fireEvent.click(resendButton()); });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith("Failed to resend verification email.");
    expect(errorSpy).toHaveBeenCalledWith("Error resending verification:", failure);
    expect(resendButton()).toBeEnabled();

    mockedApi.post.mockResolvedValue({ data: {} });
    await act(async () => { fireEvent.click(resendButton()); });
    expect(mockedApi.post).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenLastCalledWith("Verification email sent! Please check your inbox.");
  });

  it("shows 'Sending...' and blocks a second request while one is in flight", async () => {
    let resolve!: (value: unknown) => void;
    mockedApi.post.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<EmailVerificationBanner />);

    fireEvent.click(resendButton());
    await waitFor(() => expect(resendButton()).toBeDisabled());
    expect(resendButton()).toHaveTextContent("Sending...");
    expect(resendButton()).toHaveStyle({ cursor: "wait" });
    fireEvent.click(resendButton());
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();

    await act(async () => { resolve({ data: {} }); });
    expect(resendButton()).toBeEnabled();
    expect(resendButton()).toHaveTextContent("Resend verification email");
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });
});
