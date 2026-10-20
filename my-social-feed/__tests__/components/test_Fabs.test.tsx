import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewPostFab, SearchFab } from "@/components/Fabs";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

describe("SearchFab", () => {
  it("opens search, at the offset it's given", () => {
    render(<SearchFab bottom="100px" />);
    const button = screen.getByRole("button", { name: "Search" });
    expect(button.style.bottom).toBe("100px");
    fireEvent.click(button);
    expect(mockPush).toHaveBeenCalledWith("/search");
  });
});

describe("NewPostFab", () => {
  it("calls onClick, at the offset it's given", () => {
    const onClick = jest.fn();
    render(<NewPostFab bottom="30px" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "New post" });
    expect(button.style.bottom).toBe("30px");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
