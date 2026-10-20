import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TitlePrompt from "@/app/chronicle/TitlePrompt";

const setup = () => {
  const onSubmit = jest.fn();
  render(<TitlePrompt onSubmit={onSubmit} />);
  return { onSubmit, input: screen.getByTestId("title-input") as HTMLInputElement };
};

describe("TitlePrompt", () => {
  it("asks the reader to name their story", () => {
    const { input } = setup();
    expect(screen.getByTestId("title-prompt")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chronicle" })).toBeInTheDocument();
    expect(screen.getByText(/Name your story/)).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "The tale of...");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("reflects what the reader types", () => {
    const { input, onSubmit } = setup();
    fireEvent.change(input, { target: { value: "The Digital Odyssey" } });
    expect(input).toHaveValue("The Digital Odyssey");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  const titles: Array<[string, string, string]> = [
    ["a plain title", "The Digital Odyssey", "The Digital Odyssey"],
    ["a title with surrounding whitespace", "  My Story \t", "My Story"],
    ["an empty title", "", ""],
    ["a whitespace-only title", "   ", ""],
  ];

  it.each(titles)("submits %s via the button", (_name, typed, expected) => {
    const { input, onSubmit } = setup();
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.click(screen.getByRole("button", { name: "Begin Reading" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expected);
  });

  it.each(titles)("submits %s via the Enter key", (_name, typed, expected) => {
    const { input, onSubmit } = setup();
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expected);
  });

  it.each(["a", "Tab", "Escape", " "])("does not submit when the key pressed is %p", (key) => {
    const { input, onSubmit } = setup();
    fireEvent.change(input, { target: { value: "My Story" } });
    fireEvent.keyDown(input, { key });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the latest value after edits", () => {
    const { input, onSubmit } = setup();
    fireEvent.change(input, { target: { value: "First draft" } });
    fireEvent.change(input, { target: { value: "Final title" } });
    fireEvent.click(screen.getByTestId("title-submit"));
    expect(onSubmit).toHaveBeenCalledWith("Final title");
  });
});
