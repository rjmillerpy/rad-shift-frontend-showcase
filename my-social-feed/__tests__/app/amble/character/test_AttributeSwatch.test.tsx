import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import AttributeSwatch from "@/app/amble/character/AttributeSwatch";

describe("AttributeSwatch", () => {
  it("renders with the id in a stable data-testid", () => {
    render(<AttributeSwatch id="peach" color="#f5c6a0" selected={false} onSelect={jest.fn()} />);
    expect(screen.getByTestId("amble-swatch-peach")).toBeInTheDocument();
  });

  it("fires onSelect with its id on click", () => {
    const handle = jest.fn();
    render(<AttributeSwatch id="peach" color="#f5c6a0" selected={false} onSelect={handle} />);
    fireEvent.click(screen.getByTestId("amble-swatch-peach"));
    expect(handle).toHaveBeenCalledWith("peach");
  });

  it("reflects selected=true through aria-pressed", () => {
    render(<AttributeSwatch id="peach" color="#f5c6a0" selected onSelect={jest.fn()} />);
    expect(screen.getByTestId("amble-swatch-peach").getAttribute("aria-pressed")).toBe("true");
  });

  it("uses the label when provided for aria-label", () => {
    render(
      <AttributeSwatch id="peach" color="#f5c6a0" selected={false} onSelect={jest.fn()} label="Peach skin" />,
    );
    expect(screen.getByLabelText("Peach skin")).toBeInTheDocument();
  });
});
