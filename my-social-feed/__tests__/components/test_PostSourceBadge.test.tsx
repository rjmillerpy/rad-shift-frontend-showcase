import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PostSourceBadge from "@/components/PostSourceBadge";

describe("PostSourceBadge", () => {
  it("renders nothing without a label", () => {
    const { container } = render(
      <PostSourceBadge source={{ platform: "reddit", name: "", url: null, label: "" }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the label as a span when no url is provided", () => {
    render(
      <PostSourceBadge
        source={{ platform: "web", name: "Hacker News", url: null, label: "Hacker News" }}
      />
    );
    expect(screen.getByText("Hacker News").tagName).toBe("SPAN");
  });

  it("renders the label as a link when source.url is set", () => {
    render(
      <PostSourceBadge
        source={{
          platform: "reddit",
          name: "r/python",
          url: "https://reddit.com/r/python",
          label: "Reddit · r/python",
        }}
      />
    );
    const link = screen.getByText("Reddit · r/python").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "https://reddit.com/r/python");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("stops click propagation so the parent post link isn't followed", () => {
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <PostSourceBadge
          source={{
            platform: "reddit",
            name: "r/python",
            url: "https://reddit.com/r/python",
            label: "Reddit · r/python",
          }}
        />
      </div>
    );
    fireEvent.click(screen.getByText("Reddit · r/python"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
