import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import HUD from "@/app/amble/ui/HUD";

describe("HUD", () => {
  it("renders with the amble-hud testid", () => {
    render(<HUD onEditAvatar={jest.fn()} />);
    expect(screen.getByTestId("amble-hud")).toBeInTheDocument();
  });

  it("fires onEditAvatar when the edit button is clicked", () => {
    const onEdit = jest.fn();
    render(<HUD onEditAvatar={onEdit} />);
    fireEvent.click(screen.getByTestId("amble-hud-edit-avatar"));
    expect(onEdit).toHaveBeenCalled();
  });
});
