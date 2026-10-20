import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

// jsdom doesn't support scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

let mockId = "1";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useParams: () => ({ id: mockId }),
}));

import SandboxPage from "@/app/widgets/[id]/sandbox/page";

const sampleConfigs = [
  { browser: "Chrome", os: "Windows 11", user_agent: "Mozilla/5.0 Chrome" },
  { browser: "Firefox", os: "Linux", user_agent: "Mozilla/5.0 Firefox" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.get.mockImplementation((url: string) => {
    if (url.includes("/sandbox/configs")) return Promise.resolve({ data: { configs: sampleConfigs } });
    if (url.includes("/sandbox")) return Promise.resolve({ data: "<p>Widget</p>" });
    return Promise.resolve({ data: {} });
  });
});

describe("SandboxPage", () => {
  it("renders sandbox title", async () => {
    await act(async () => { render(<SandboxPage />); });
    await waitFor(() => expect(screen.getByText(/sandbox/i)).toBeInTheDocument());
  });

  it("renders browser selector", async () => {
    await act(async () => { render(<SandboxPage />); });
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("renders quarantined iframe", async () => {
    await act(async () => { render(<SandboxPage />); });
    await waitFor(() => {
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });
  });

  it("renders network monitor section", async () => {
    await act(async () => { render(<SandboxPage />); });
    await waitFor(() => expect(screen.getAllByText(/network monitor/i).length).toBeGreaterThan(0));
  });

  it("renders run full scan button", async () => {
    await act(async () => { render(<SandboxPage />); });
    await waitFor(() => expect(screen.getByText(/run full scan/i)).toBeInTheDocument());
  });
});
