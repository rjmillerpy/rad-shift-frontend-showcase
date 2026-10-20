import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FloatingActions from "@/app/lame/FloatingActions";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("FloatingActions", () => {
  test.each([true, false])("search navigates to /search (showNewPost=%s)", (showNewPost) => {
    const onNewPost = jest.fn();
    render(<FloatingActions showNewPost={showNewPost} onNewPost={onNewPost} />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/search");
    expect(onNewPost).not.toHaveBeenCalled();
  });

  it("offers 'New post' when allowed and reports the click without navigating", () => {
    const onNewPost = jest.fn();
    render(<FloatingActions showNewPost onNewPost={onNewPost} />);
    fireEvent.click(screen.getByRole("button", { name: "New post" }));
    expect(onNewPost).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("hides 'New post' when not allowed", () => {
    render(<FloatingActions showNewPost={false} onNewPost={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "New post" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  test.each([
    ["moves up to make room for 'New post'", true, "100px"],
    ["sits in the corner on its own", false, "30px"],
  ])("the search button %s", (_name, showNewPost, bottom) => {
    render(<FloatingActions showNewPost={showNewPost} onNewPost={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Search" })).toHaveStyle({ bottom });
    if (showNewPost) {
      expect(screen.getByRole("button", { name: "New post" })).toHaveStyle({ bottom: "30px" });
    }
  });
});
