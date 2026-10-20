import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import WidgetCard from "@/components/WidgetCard";

const mockWidget = {
  id: 5,
  title: "Cool Widget",
  description: "Does something cool",
  category: "Tools",
  language: "html",
  icon_emoji: "\u{1F525}",
  author_username: "devuser",
  status: "approved",
  install_count: 42,
  likes: 15,
  saves: 7,
  rating_avg: 3.8,
  default_width: 400,
  default_height: 300,
  resizable: false,
  tags: null,
  permissions: null,
};

describe("WidgetCard", () => {
  it("renders icon and title", () => {
    render(<WidgetCard widget={mockWidget} />);
    expect(screen.getByText("\u{1F525}")).toBeInTheDocument();
    expect(screen.getByText("Cool Widget")).toBeInTheDocument();
  });

  it("renders iframe with correct dimensions", () => {
    render(<WidgetCard widget={mockWidget} defaultWidth={350} defaultHeight={250} />);
    const iframe = screen.getByTitle("Cool Widget");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "http://localhost:5000/widgets/5/render");
    expect(iframe.style.width).toBe("350px");
    expect(iframe.style.height).toBe("250px");
  });

  it("shows install count", () => {
    render(<WidgetCard widget={mockWidget} />);
    expect(screen.getByText("42 installs")).toBeInTheDocument();
  });

  it("expand button toggles size", () => {
    render(<WidgetCard widget={mockWidget} />);
    const iframe = screen.getByTitle("Cool Widget");

    expect(screen.getByText("Expand")).toBeInTheDocument();
    expect(iframe.style.width).toBe("400px");
    expect(iframe.style.height).toBe("300px");

    fireEvent.click(screen.getByText("Expand"));
    expect(screen.getByText("Collapse")).toBeInTheDocument();
    // Expanded: min(800, 400*1.8)=720, min(600, 300*1.8)=540
    expect(iframe.style.width).toBe("720px");
    expect(iframe.style.height).toBe("540px");

    fireEvent.click(screen.getByText("Collapse"));
    expect(iframe.style.width).toBe("400px");
    expect(iframe.style.height).toBe("300px");
  });

  it("is exported as React.memo", () => {
    // WidgetCard is wrapped with React.memo, so its type name should reflect that
    // React.memo components have a $$typeof of Symbol(react.memo)
    expect(WidgetCard).toHaveProperty("$$typeof", Symbol.for("react.memo"));
  });

  it("renders author username", () => {
    render(<WidgetCard widget={mockWidget} />);
    expect(screen.getByText("by devuser")).toBeInTheDocument();
  });

  it("links to the widget detail page", () => {
    render(<WidgetCard widget={mockWidget} />);
    const link = screen.getByText("Cool Widget").closest("a");
    expect(link).toHaveAttribute("href", "/widgets/5");
  });
});
