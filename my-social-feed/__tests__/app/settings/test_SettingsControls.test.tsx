import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckboxSettings, RangeSetting } from "@/app/settings/SettingsControls";

describe("RangeSetting", () => {
  const setup = (extra: Partial<React.ComponentProps<typeof RangeSetting>> = {}) => {
    const onChange = jest.fn();
    render(
      <RangeSetting label="Font Size" display="16px" value={16} min={12} max={24} step={1}
        onChange={onChange} testId="slider-font" {...extra} />,
    );
    return onChange;
  };

  it("is a slider labelled by its name, showing the current value", () => {
    setup();
    expect(screen.getByLabelText(/Font Size/)).toHaveAttribute("type", "range");
    expect(screen.getByText("16px")).toBeInTheDocument();
  });

  it("reports the new value as a number", () => {
    const onChange = setup();
    fireEvent.change(screen.getByTestId("slider-font"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("shows end hints when given", () => {
    setup({ hints: ["Small", "Large"] });
    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
  });
});

describe("CheckboxSettings", () => {
  it("renders a labelled checkbox per option and reports changes by key", () => {
    const onChange = jest.fn();
    render(
      <CheckboxSettings
        options={[{ key: "a", label: "Option A" }, { key: "b", label: "Option B" }]}
        isChecked={(key) => key === "a"}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText("Option A")).toBeChecked();
    expect(screen.getByLabelText("Option B")).not.toBeChecked();
    fireEvent.click(screen.getByTestId("toggle-b"));
    expect(onChange).toHaveBeenCalledWith("b", true);
  });
});
