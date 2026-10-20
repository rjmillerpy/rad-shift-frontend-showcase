import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

import WidgetCreatePage from "@/app/widgets/create/page";

beforeEach(() => jest.clearAllMocks());

describe("WidgetCreatePage", () => {
  it("renders multi-panel editor with HTML, CSS, JS, and Compute panels", () => {
    render(<WidgetCreatePage />);
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("CSS")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
    expect(screen.getByText("Compute")).toBeInTheDocument();
  });

  it("renders title input and category selector", () => {
    render(<WidgetCreatePage />);
    expect(screen.getByPlaceholderText("Widget title...")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Server")).toBeInTheDocument();
  });

  it("renders template picker buttons", () => {
    render(<WidgetCreatePage />);
    expect(screen.getAllByText(/Games/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Tools/i).length).toBeGreaterThanOrEqual(1);
  });

  it("preview renders iframe with combined HTML+CSS+JS", async () => {
    render(<WidgetCreatePage />);
    // Click the Preview button (not the Preview label section)
    const previewBtn = screen.getAllByText("Preview").find(el => el.tagName === "BUTTON");
    if (previewBtn) fireEvent.click(previewBtn);
    await waitFor(() => {
      const iframe = screen.getByTitle("Widget Preview");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("srcDoc");
    });
  });

  it("save draft calls POST /widgets", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 42 } });
    render(<WidgetCreatePage />);
    const titleInput = screen.getByPlaceholderText("Widget title...");
    fireEvent.change(titleInput, { target: { value: "Test Widget" } });

    await act(async () => { fireEvent.click(screen.getByText("Save Draft")); });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/widgets", expect.objectContaining({
        title: "Test Widget",
        submit_for_review: false,
      }));
    });
    expect(mockPush).toHaveBeenCalledWith("/widgets/42");
  });

  it("submit calls POST /widgets with submit_for_review true", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 7 } });
    render(<WidgetCreatePage />);
    const titleInput = screen.getByPlaceholderText("Widget title...");
    fireEvent.change(titleInput, { target: { value: "Submit Widget" } });

    await act(async () => { fireEvent.click(screen.getByText("Submit")); });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/widgets", expect.objectContaining({
        title: "Submit Widget",
        submit_for_review: true,
      }));
    });
  });

  it("does not save if title is empty", async () => {
    window.alert = jest.fn();
    render(<WidgetCreatePage />);
    await act(async () => { fireEvent.click(screen.getByText("Save Draft")); });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("compute panel Run button calls execute endpoint", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { stdout: "Hello" } });
    render(<WidgetCreatePage />);

    // Expand compute panel
    const computeToggle = screen.getAllByRole("button").find(b => b.textContent === "▶");
    if (computeToggle) fireEvent.click(computeToggle);

    // Type code in compute textarea
    const computeInput = screen.getByPlaceholderText(/Python or SQL/i);
    fireEvent.change(computeInput, { target: { value: "print('hello')" } });

    await act(async () => { fireEvent.click(screen.getByText("Run")); });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/widgets/execute", expect.objectContaining({
        code: "print('hello')",
        language: "python",
      }));
    });
  });

  it("compute panel shows the server's reason when execution is refused", async () => {
    const { AxiosError } = jest.requireActual("axios");
    const err = new AxiosError("Service Unavailable");
    err.response = { status: 503, data: { detail: "Server-side widget execution is disabled" } };
    (api.post as jest.Mock).mockRejectedValue(err);
    jest.spyOn(console, "error").mockImplementation(() => {});
    render(<WidgetCreatePage />);

    const computeToggle = screen.getAllByRole("button").find(b => b.textContent === "▶");
    if (computeToggle) fireEvent.click(computeToggle);
    fireEvent.change(screen.getByPlaceholderText(/Python or SQL/i), { target: { value: "print(1)" } });
    await act(async () => { fireEvent.click(screen.getByText("Run")); });

    expect(await screen.findByText("Server-side widget execution is disabled")).toBeInTheDocument();
  });
});
