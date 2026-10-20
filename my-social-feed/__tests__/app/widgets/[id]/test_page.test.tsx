import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));

jest.mock("@/lib/config", () => ({
  API_URL: "http://localhost:5000",
}));

let mockId = "1";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useParams: () => ({ id: mockId }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import WidgetDetailPage from "@/app/widgets/[id]/page";

const mockWidget = {
  id: 1,
  title: "Test Widget",
  description: "A great widget for testing",
  category: "Tools",
  language: "html",
  icon_emoji: null,
  author_username: "alice",
  status: "approved",
  install_count: 25,
  likes: 10,
  saves: 3,
  rating_avg: 4.5,
  default_width: 400,
  default_height: 300,
  resizable: false,
  tags: null,
  permissions: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockId = "1";
  // Mock window.innerWidth for expanded iframe calculations
  Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });

  (api.get as jest.Mock).mockImplementation((url: string) => {
    if (url === "/widgets/1") {
      return Promise.resolve({
        data: { widget: mockWidget, installed: false, liked: false, saved: false, my_rating: 0 },
      });
    }
    if (url === "/widgets/1/reviews") {
      return Promise.resolve({ data: { reviews: [] } });
    }
    return Promise.resolve({ data: {} });
  });
});

describe("WidgetDetailPage", () => {
  it("renders widget title and description", async () => {
    await act(async () => { render(<WidgetDetailPage />); });
    await waitFor(() => {
      expect(screen.getByText("Test Widget")).toBeInTheDocument();
      expect(screen.getByText("A great widget for testing")).toBeInTheDocument();
    });
  });

  it("renders a sandboxed iframe", async () => {
    await act(async () => { render(<WidgetDetailPage />); });
    await waitFor(() => {
      const iframe = screen.getByTitle("Test Widget");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("sandbox", "allow-scripts allow-forms");
      expect(iframe).toHaveAttribute("src", "http://localhost:5000/widgets/1/render");
    });
  });

  it("install/uninstall button calls the API", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: {} });
    await act(async () => { render(<WidgetDetailPage />); });

    await waitFor(() => expect(screen.getByText(/Install/)).toBeInTheDocument());

    const installBtn = screen.getByText(/Install \(25\)/);
    await act(async () => { fireEvent.click(installBtn); });

    expect(api.post).toHaveBeenCalledWith("/widgets/1/install");

    // After install, the button should show Uninstall
    await waitFor(() => {
      expect(screen.getByText(/Uninstall \(26\)/)).toBeInTheDocument();
    });

    // Uninstall
    (api.delete as jest.Mock).mockResolvedValue({ data: {} });
    await act(async () => { fireEvent.click(screen.getByText(/Uninstall/)); });
    expect(api.delete).toHaveBeenCalledWith("/widgets/1/install");
  });

  it("star rating submission calls the API", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: {} });
    await act(async () => { render(<WidgetDetailPage />); });

    await waitFor(() => expect(screen.getByText("Rate this widget")).toBeInTheDocument());

    // Click the 4th star (stars are rendered as buttons with star characters)
    const starButtons = screen.getAllByText("\u2605");
    expect(starButtons).toHaveLength(5);
    await act(async () => { fireEvent.click(starButtons[3]); });

    expect(api.post).toHaveBeenCalledWith("/widgets/1/rate", { rating: 4 });
  });

  it("expand button toggles iframe size", async () => {
    await act(async () => { render(<WidgetDetailPage />); });
    await waitFor(() => expect(screen.getByText("Expand")).toBeInTheDocument());

    const iframe = screen.getByTitle("Test Widget");
    const initialWidth = iframe.style.width;

    fireEvent.click(screen.getByText("Expand"));
    expect(screen.getByText("Collapse")).toBeInTheDocument();

    const expandedWidth = iframe.style.width;
    expect(expandedWidth).not.toEqual(initialWidth);
  });

  it("shows widget not found when API rejects", async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/widgets/1") return Promise.reject(new Error("Not found"));
      if (url === "/widgets/1/reviews") return Promise.resolve({ data: { reviews: [] } });
      return Promise.resolve({ data: {} });
    });

    await act(async () => { render(<WidgetDetailPage />); });
    await waitFor(() => {
      expect(screen.getByText("Widget not found")).toBeInTheDocument();
    });
  });
});
