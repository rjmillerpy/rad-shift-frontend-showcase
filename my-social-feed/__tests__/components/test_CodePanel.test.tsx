/**
 * Tests for src/components/CodePanel.tsx — labelled, collapsible code editor panel.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import CodePanel from "@/components/CodePanel";


describe("CodePanel", () => {
  test("renders the label, icon, and current value", () => {
    render(
      <CodePanel
        label="HTML"
        icon="\u{1F4C4}"
        value="<p>hi</p>"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByDisplayValue("<p>hi</p>")).toBeInTheDocument();
  });

  test("typing in the textarea triggers onChange with the new value", () => {
    const onChange = jest.fn();
    render(
      <CodePanel label="JS" icon="\u{1F4C4}" value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "let x = 1;" } });
    expect(onChange).toHaveBeenCalledWith("let x = 1;");
  });

  test("textarea hidden when collapsed=true", () => {
    render(
      <CodePanel label="CSS" icon="\u{1F4C4}" value="body {}" onChange={() => {}} collapsed />,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("collapse toggle fires onToggleCollapse", () => {
    const onToggle = jest.fn();
    render(
      <CodePanel
        label="CSS" icon="\u{1F4C4}" value="" onChange={() => {}}
        collapsed={false} onToggleCollapse={onToggle}
      />,
    );
    fireEvent.click(screen.getByTitle("Collapse"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("extra action buttons render when provided", () => {
    render(
      <CodePanel
        label="SQL" icon="\u{1F4C4}" value="" onChange={() => {}}
        actions={<button>run</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "run" })).toBeInTheDocument();
  });

  test("toggle button absent when onToggleCollapse not provided", () => {
    render(<CodePanel label="JS" icon="\u{1F4C4}" value="" onChange={() => {}} />);
    expect(screen.queryByTitle(/collapse/i)).not.toBeInTheDocument();
  });
});
