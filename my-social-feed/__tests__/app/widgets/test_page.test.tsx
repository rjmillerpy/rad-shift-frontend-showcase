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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import WidgetsPage from "@/app/widgets/page";

const mockWidget = (id: number) => ({
  id,
  title: `Widget ${id}`,
  description: `Description ${id}`,
  category: "Games",
  language: "html",
  icon_emoji: null,
  author_username: "testuser",
  status: "approved",
  install_count: 10,
  likes: 5,
  saves: 2,
  rating_avg: 4.2,
  default_width: 400,
  default_height: 300,
  resizable: false,
  tags: null,
  permissions: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  (api.get as jest.Mock).mockImplementation((url: string) => {
    if (url === "/widgets/installed") return Promise.resolve({ data: { widget_ids: [] } });
    if (url === "/widgets") return Promise.resolve({ data: { widgets: [mockWidget(1), mockWidget(2)], has_more: false } });
    return Promise.resolve({ data: {} });
  });
});

describe("WidgetsPage", () => {
  it("renders the Widget Store title", async () => {
    await act(async () => { render(<WidgetsPage />); });
    expect(screen.getByText("Widget Store")).toBeInTheDocument();
  });

  it("renders category tabs", async () => {
    await act(async () => { render(<WidgetsPage />); });
    const categories = ["All", "Games", "Tools", "API Connectors", "Display Modifiers", "Lambda", "Visualization", "Social"];
    categories.forEach((cat) => {
      expect(screen.getByText(cat)).toBeInTheDocument();
    });
  });

  it("fetches and displays widgets", async () => {
    await act(async () => { render(<WidgetsPage />); });
    await waitFor(() => {
      expect(screen.getByText("Widget 1")).toBeInTheDocument();
      expect(screen.getByText("Widget 2")).toBeInTheDocument();
    });
    expect(api.get).toHaveBeenCalledWith("/widgets", { params: { offset: 0, limit: 18 } });
  });

  it("category filter changes the API call", async () => {
    await act(async () => { render(<WidgetsPage />); });
    await waitFor(() => expect(screen.getByText("Widget 1")).toBeInTheDocument());

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/widgets/installed") return Promise.resolve({ data: { widget_ids: [] } });
      if (url === "/widgets") return Promise.resolve({ data: { widgets: [mockWidget(3)], has_more: false } });
      return Promise.resolve({ data: {} });
    });

    await act(async () => { fireEvent.click(screen.getByText("Games")); });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/widgets", { params: { offset: 0, limit: 18, category: "Games" } });
    });
  });

  it("install button calls the API", async () => {
    await act(async () => { render(<WidgetsPage />); });
    await waitFor(() => expect(screen.getByText("Widget 1")).toBeInTheDocument());

    (api.post as jest.Mock).mockResolvedValue({ data: {} });
    const installButtons = screen.getAllByText("Install");
    await act(async () => { fireEvent.click(installButtons[0]); });
    expect(api.post).toHaveBeenCalledWith("/widgets/1/install");
  });

  it("shows empty state when no widgets found", async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/widgets/installed") return Promise.resolve({ data: { widget_ids: [] } });
      if (url === "/widgets") return Promise.resolve({ data: { widgets: [], has_more: false } });
      return Promise.resolve({ data: {} });
    });

    await act(async () => { render(<WidgetsPage />); });
    await waitFor(() => {
      expect(screen.getByText("No widgets found.")).toBeInTheDocument();
    });
  });

  it("renders Create Widget link", async () => {
    await act(async () => { render(<WidgetsPage />); });
    const link = screen.getByText("+ Create Widget");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/widgets/create");
  });
});
