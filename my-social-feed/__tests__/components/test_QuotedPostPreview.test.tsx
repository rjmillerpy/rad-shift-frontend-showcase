import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuotedPostPreview from "@/components/QuotedPostPreview";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children);
});

describe("QuotedPostPreview", () => {
  it("renders the quoted username and full body when short", () => {
    render(
      <QuotedPostPreview
        quotedPost={{ id: 7, username: "alice", text: "Short quote body." }}
      />
    );
    expect(screen.getByText("Quoting @alice")).toBeInTheDocument();
    expect(screen.getByText(/Short quote body\./)).toBeInTheDocument();
  });

  it("truncates the body with ellipsis when longer than 160 chars", () => {
    const long = "a".repeat(200);
    render(
      <QuotedPostPreview quotedPost={{ id: 1, username: "bob", text: long }} />
    );
    expect(screen.getByText(/…/)).toBeInTheDocument();
  });

  it("links to the quoted post page", () => {
    render(
      <QuotedPostPreview quotedPost={{ id: 42, username: "carol", text: "x" }} />
    );
    const link = screen.getByText("Quoting @carol").closest("a");
    expect(link).toHaveAttribute("href", "/post/42");
  });

  it("stops click propagation", () => {
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <QuotedPostPreview quotedPost={{ id: 1, username: "x", text: "y" }} />
      </div>
    );
    fireEvent.click(screen.getByText("Quoting @x"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
