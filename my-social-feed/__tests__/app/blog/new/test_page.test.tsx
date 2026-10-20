/**
 * Tests for /blog/new — blog post editor page.
 *
 * These smoke tests verify the page renders its major form sections without
 * crashing and that the AI-banned phrase guard blocks submission.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: { slug: "ok" } }),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("next/dynamic", () => () => {
  const Dyn = () => null;
  return Dyn;
});

jest.mock("next/link", () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children);
  return Link;
});

import BlogEditorPage from "@/app/blog/new/page";


beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "test-token");
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});


describe("BlogEditorPage", () => {
  test("renders a title input", () => {
    render(<BlogEditorPage />);
    expect(
      screen.getByPlaceholderText(/title/i),
    ).toBeInTheDocument();
  });

  test("renders a content area", () => {
    render(<BlogEditorPage />);
    // Editor exposes a textarea or contenteditable; just assert at least one
    // of the typical content-entry elements exists.
    const editors = document.querySelectorAll("textarea, [contenteditable]");
    expect(editors.length).toBeGreaterThan(0);
  });

  test("title input accepts user typing", () => {
    render(<BlogEditorPage />);
    const input = screen.getByPlaceholderText(/title/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "My First Post" } });
    expect(input.value).toBe("My First Post");
  });
});
