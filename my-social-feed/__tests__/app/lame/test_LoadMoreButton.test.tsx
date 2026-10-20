import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LoadMoreButton from "@/app/lame/LoadMoreButton";

describe("LoadMoreButton", () => {
  it("is an enabled, labelled button when idle", () => {
    render(<LoadMoreButton loading={false} onLoadMore={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Load more" });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("title", "Load more");
    expect(screen.getByAltText("Load more")).toHaveAttribute("src", "/paginate.png");
  });

  it("asks for the next page on each click", () => {
    const onLoadMore = jest.fn();
    render(<LoadMoreButton loading={false} onLoadMore={onLoadMore} />);
    const button = screen.getByRole("button", { name: "Load more" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it("is disabled and ignores clicks while the next page loads", () => {
    const onLoadMore = jest.fn();
    render(<LoadMoreButton loading onLoadMore={onLoadMore} />);
    const button = screen.getByRole("button", { name: "Load more" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  test.each([
    ["idle", false, { cursor: "pointer", opacity: "1" }],
    ["loading", true, { cursor: "wait", opacity: "0.5" }],
  ])("looks %s", (_name, loading, style) => {
    render(<LoadMoreButton loading={loading} onLoadMore={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Load more" })).toHaveStyle(style);
  });

  it("becomes clickable again once loading finishes", () => {
    const onLoadMore = jest.fn();
    const { rerender } = render(<LoadMoreButton loading onLoadMore={onLoadMore} />);
    rerender(<LoadMoreButton loading={false} onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
