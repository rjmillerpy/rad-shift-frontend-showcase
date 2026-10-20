import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders 404 message", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("has link back to home", () => {
    render(<NotFound />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });
});
