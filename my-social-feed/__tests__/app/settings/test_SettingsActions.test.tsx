import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsActions from "@/app/settings/SettingsActions";

const colors = { background: "#123456", color: "#fff" };

describe("SettingsActions", () => {
  it("saves and resets", () => {
    const onSave = jest.fn();
    const onReset = jest.fn();
    render(<SettingsActions saving={false} saved={false} onSave={onSave} onReset={onReset} saveColors={colors} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset to Defaults" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("shows progress and disables save while saving", () => {
    render(<SettingsActions saving saved={false} onSave={jest.fn()} onReset={jest.fn()} saveColors={colors} />);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("confirms a save, and takes a custom reset label", () => {
    render(<SettingsActions saving={false} saved onSave={jest.fn()} onReset={jest.fn()} saveColors={colors} resetLabel="Reset" />);
    expect(screen.getByText("Settings saved!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });
});
