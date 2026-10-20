import React from "react";
import { render } from "@testing-library/react";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children", () => {
    // RootLayout renders <html> and <body> which jsdom merges with the
    // existing document. We verify children appear in the document body.
    render(<RootLayout><p>Child content</p></RootLayout>);
    expect(document.body.textContent).toContain("Child content");
  });

  it("has html and body tags", () => {
    render(<RootLayout><p>Test</p></RootLayout>);
    // Verify the document has html and body elements (RootLayout provides them)
    expect(document.querySelector("html")).toBeTruthy();
    expect(document.querySelector("body")).toBeTruthy();
    // Verify the body has the antialiased class from the layout
    expect(document.body.className).toContain("antialiased");
  });
});
