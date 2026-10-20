import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EditorToolbar from "@/app/blog/new/EditorToolbar";
import { TOOLBAR } from "@/app/blog/new/constants";

describe("EditorToolbar", () => {
  it("renders one titled button per toolbar entry, in order", () => {
    render(<EditorToolbar onInsert={jest.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("title"))).toEqual(TOOLBAR.map((b) => b.label));
    for (const entry of TOOLBAR) {
      const button = screen.getByTestId(`toolbar-${entry.cmd}`);
      expect(button).toHaveTextContent(entry.icon);
      expect(button).toHaveTextContent(entry.label);
    }
  });

  test.each<[string, string, boolean]>([
    ["strong", "strong", true],
    ["em", "em", true],
    ["h2", "h2", true],
    ["h3", "h3", true],
    ["blockquote", "blockquote", true],
    ["code", "code", true],
    ["ul", "<ul>\n  <li></li>\n</ul>", false],
    ["a", '<a href="">', false],
    ["img", '<img src="" alt="" />', false],
    ["hr", "<hr />", false],
  ])("the '%s' button inserts %j (wrap selection: %s)", (cmd, text, wrap) => {
    const onInsert = jest.fn();
    render(<EditorToolbar onInsert={onInsert} />);
    fireEvent.click(screen.getByTestId(`toolbar-${cmd}`));
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert).toHaveBeenCalledWith(text, wrap);
  });

  it("covers every toolbar entry with an insert action", () => {
    const onInsert = jest.fn();
    render(<EditorToolbar onInsert={onInsert} />);
    for (const entry of TOOLBAR) fireEvent.click(screen.getByTestId(`toolbar-${entry.cmd}`));
    expect(onInsert).toHaveBeenCalledTimes(TOOLBAR.length);
    for (const [text, wrap] of onInsert.mock.calls) {
      expect(typeof text).toBe("string");
      expect(text).not.toBe("");
      expect(typeof wrap).toBe("boolean");
    }
  });

  test.each([
    ["Bold", { fontWeight: "bold" }],
    ["Italic", { fontStyle: "italic" }],
    ["Code Block", { fontFamily: "monospace" }],
  ])("styles the %s button after what it inserts", (title, style) => {
    render(<EditorToolbar onInsert={jest.fn()} />);
    expect(screen.getByTitle(title)).toHaveStyle(style);
  });
});
