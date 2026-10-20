import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ContextBar from "@/app/bubbles/ContextBar";
import type { NavHistoryEntry, TopicDef } from "@/app/bubbles/types";
import type { Post } from "@/types/post";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1, text: "A fairly long post about quantum computing breakthroughs", username: "alice",
  likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
  ...overrides,
});

const tech: TopicDef = { label: "Technology", color: "#e74c3c" };

type Props = React.ComponentProps<typeof ContextBar>;
const renderBar = (overrides: Partial<Props> = {}) => {
  const onTakeBreak = jest.fn();
  render(
    <ContextBar
      navHistory={[]}
      selectedTopic={tech}
      selectedPost={null}
      sessionGoal={null}
      focusTimer={0}
      depthLevel={1}
      onTakeBreak={onTakeBreak}
      {...overrides}
    />,
  );
  return { onTakeBreak };
};

describe("ContextBar", () => {
  it("shows the selected topic as the current location", () => {
    renderBar();
    expect(screen.getByTestId("context-bar")).toHaveTextContent("Path:");
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("shows a truncated preview of the selected post instead of the topic", () => {
    renderBar({ selectedPost: makePost() });
    // 25 characters of the post text followed by an ellipsis
    expect(screen.getByText("A fairly long post about …")).toBeInTheDocument();
    expect(screen.queryByText("Technology")).not.toBeInTheDocument();
  });

  it.each([
    ["shown when set", "Learn about AI", true],
    ["hidden when null", null, false],
    ["hidden when empty", "", false],
  ])("session goal is %s", (_name, sessionGoal, visible) => {
    renderBar({ sessionGoal });
    const goal = screen.queryByTestId("session-goal");
    if (visible) expect(goal).toHaveTextContent(`🎯 ${sessionGoal}`);
    else expect(goal).not.toBeInTheDocument();
  });

  it("renders one breadcrumb per history entry: overview, topic, then truncated post", () => {
    const navHistory: NavHistoryEntry[] = [
      { topic: null, post: null },
      { topic: { label: "Science", color: "#3498db" }, post: null },
      { topic: tech, post: makePost({ text: "Another long post about rockets and space" }) },
    ];
    renderBar({ navHistory });
    const bar = screen.getByTestId("context-bar");
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
    // 20 characters of the post text followed by an ellipsis
    expect(screen.getByText("Another long post ab…")).toBeInTheDocument();
    expect(bar.textContent?.match(/→/g)).toHaveLength(3);
    expect(bar.textContent).toMatch(/Overview.*Science.*Another long post ab….*Technology/);
  });

  it("renders no breadcrumb arrows when there is no history", () => {
    renderBar({ navHistory: [] });
    expect(screen.getByTestId("context-bar").textContent).not.toContain("→");
  });

  it.each([
    ["zero", 0, "0:00", true],
    ["single-digit seconds are padded", 5, "0:05", true],
    ["just under the threshold", 29, "0:29", true],
    ["exactly at the threshold", 30, "0:30", false],
    ["over a minute", 65, "1:05", false],
    ["ten minutes", 600, "10:00", false],
  ])("focus timer — %s (%is) reads %s", (_name, focusTimer, formatted, nudged) => {
    renderBar({ focusTimer });
    const timer = screen.getByTestId("focus-timer");
    expect(timer).toHaveTextContent(`⏱ ${formatted}`);
    if (nudged) {
      expect(timer).toHaveTextContent("stay longer");
      expect(timer).toHaveStyle({ color: "#e74c3c" });
    } else {
      expect(timer).not.toHaveTextContent("stay longer");
      expect(timer).toHaveStyle({ color: "#2ecc71" });
    }
  });

  it.each([
    ["no depth", 0, ""],
    ["one level", 1, "🔵"],
    ["three levels", 3, "🔵🔵🔵"],
    ["the cap", 5, "🔵🔵🔵🔵🔵"],
    ["one past the cap", 6, "🔵🔵🔵🔵🔵 +1"],
    ["far past the cap", 12, "🔵🔵🔵🔵🔵 +7"],
  ])("depth indicator — %s (%i) reads %p", (_name, depthLevel, expected) => {
    renderBar({ depthLevel });
    expect(screen.getByTestId("depth-indicator").textContent).toBe(expected);
  });

  it("calls onTakeBreak when the break button is clicked", () => {
    const { onTakeBreak } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Take a break" }));
    expect(onTakeBreak).toHaveBeenCalledTimes(1);
  });
});
