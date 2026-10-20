/**
 * Tests for /widgets/[id]/sandbox — quarantine testing UI for a widget.
 */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("@/lib/config", () => ({ API_URL: "http://mock-api" }));

import api from "@/lib/api";
const mockApi = api as unknown as { get: jest.Mock; post: jest.Mock };

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "42" }),
}));

jest.mock("next/link", () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children);
  return Link;
});

import SandboxPage from "@/app/widgets/[id]/sandbox/page";


beforeAll(() => {
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.get.mockResolvedValue({
    data: { configs: [{ browser: "Chrome", os: "Linux", user_agent: "Mozilla/5.0" }] },
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());


/** The sandbox iframe's window: the only sender the page accepts. */
function iframeWindow(): Window {
  const iframe = document.querySelector("iframe");
  if (!iframe?.contentWindow) throw new Error("sandbox iframe not rendered");
  return iframe.contentWindow;
}

describe("SandboxPage", () => {
  test("loads browser configs and shows them in the selector", async () => {
    render(<SandboxPage />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/widgets/sandbox/configs"));
    await waitFor(() => expect(screen.getByText(/Chrome - Linux/)).toBeInTheDocument());
  });

  test("displays the widget id in the heading", () => {
    render(<SandboxPage />);
    expect(screen.getByText(/widget #42/i)).toBeInTheDocument();
  });

  test("renders the quarantined iframe with the right src", async () => {
    render(<SandboxPage />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toContain("/widgets/42/sandbox");
    expect(iframe?.getAttribute("sandbox")).toBe("allow-scripts");
  });

  test("ignores telemetry posted by any window other than its iframe", async () => {
    render(<SandboxPage />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        source: window, // e.g. another tab or an extension, not the sandbox
        origin: "null",
        data: {
          type: "widget_network", widget_id: "42",
          log: [{ type: "fetch", url: "https://spoofed.example.com", ts: 1 }],
          timers: 0, mutations: 0, websockets: 0, service_workers: 0,
        },
      }));
    });

    expect(screen.getByRole("button", { name: /Run Full Scan/i })).toBeDisabled();
    expect(screen.queryByText(/spoofed\.example\.com/)).toBeNull();
  });

  test("ignores telemetry from a real origin, even claiming to be the iframe", async () => {
    render(<SandboxPage />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        source: iframeWindow(),
        origin: "https://evil.example.com",
        data: {
          type: "widget_network", widget_id: "42",
          log: [], timers: 0, mutations: 0, websockets: 0, service_workers: 0,
        },
      }));
    });

    expect(screen.getByRole("button", { name: /Run Full Scan/i })).toBeDisabled();
  });

  test("captures postMessage telemetry and enables Run Full Scan", async () => {
    render(<SandboxPage />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        source: iframeWindow(),
        origin: "null", // a sandboxed iframe's opaque origin
        data: {
          type: "widget_network",
          widget_id: "42",
          log: [{ type: "fetch", url: "https://a.example.com", ts: 1 }],
          timers: 2, mutations: 0, websockets: 0, service_workers: 0,
        },
      }));
    });

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /Run Full Scan/i });
      expect(button).not.toBeDisabled();
    });
  });

  test("posts telemetry to backend when Run Full Scan is clicked", async () => {
    mockApi.post.mockResolvedValue({
      data: { analysis: {
        total_requests: 1, external_domains: ["a.example.com"],
        suspicious_domains: [], websocket_connections: 0,
        service_workers: 0, timer_count: 2,
        risk_level: "low", risk_reasons: [], warnings: [],
      } },
    });

    render(<SandboxPage />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        source: iframeWindow(),
        origin: "null", // a sandboxed iframe's opaque origin
        data: {
          type: "widget_network", widget_id: "42",
          log: [{ type: "fetch", url: "https://a.example.com", ts: 1 }],
          timers: 2, mutations: 0, websockets: 0, service_workers: 0,
        },
      }));
    });

    const button = await screen.findByRole("button", { name: /Run Full Scan/i });
    await waitFor(() => expect(button).not.toBeDisabled());
    act(() => button.click());

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(
      "/widgets/42/sandbox/telemetry",
      expect.objectContaining({ events: expect.any(Array) }),
    ));
  });
});
