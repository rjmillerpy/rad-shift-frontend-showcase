import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionGoalPrompt from "@/app/bubbles/SessionGoalPrompt";

const setup = () => {
  const onGoalSet = jest.fn();
  const onSkip = jest.fn();
  render(<SessionGoalPrompt onGoalSet={onGoalSet} onSkip={onSkip} />);
  return { onGoalSet, onSkip, input: screen.getByTestId("goal-input") as HTMLInputElement };
};

describe("SessionGoalPrompt", () => {
  it("asks the user what they are looking for", () => {
    setup();
    expect(screen.getByTestId("goal-prompt")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you looking for?" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Learn about AI/)).toBeInTheDocument();
  });

  it.each([
    ["a plain goal", "Learn about AI", "Learn about AI"],
    ["a goal with surrounding whitespace", "   find music  ", "find music"],
    ["a single character", "x", "x"],
  ])("submits %s on Enter", (_name, typed, expected) => {
    const { onGoalSet, onSkip, input } = setup();
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onGoalSet).toHaveBeenCalledTimes(1);
    expect(onGoalSet).toHaveBeenCalledWith(expected);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it.each([
    ["empty input", ""],
    ["whitespace only", "    "],
  ])("does not submit %s on Enter", (_name, typed) => {
    const { onGoalSet, input } = setup();
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onGoalSet).not.toHaveBeenCalled();
  });

  it.each(["a", "Tab", "Escape", " "])("does not submit when the key pressed is %p", (key) => {
    const { onGoalSet, input } = setup();
    fireEvent.change(input, { target: { value: "Learn about AI" } });
    fireEvent.keyDown(input, { key });
    expect(onGoalSet).not.toHaveBeenCalled();
  });

  it("sets the 'just exploring' preset when the user doesn't know", () => {
    const { onGoalSet, onSkip } = setup();
    fireEvent.click(screen.getByTestId("idk-button"));
    expect(onGoalSet).toHaveBeenCalledWith("Just exploring 🧐");
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("skips without setting a goal", () => {
    const { onGoalSet, onSkip, input } = setup();
    fireEvent.change(input, { target: { value: "ignored" } });
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onGoalSet).not.toHaveBeenCalled();
  });
});
