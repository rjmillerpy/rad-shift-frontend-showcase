import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComposerBox from "@/app/post/[id]/ComposerBox";

function setup(children?: React.ReactNode) {
  const props = {
    kind: "reply", title: "Reply to @bob", accent: "#28a745", tint: "#f0fff0", value: "hi",
    onChange: jest.fn(), placeholder: "Write a reply...", submitLabel: "Post Reply",
    onSubmit: jest.fn(), onClose: jest.fn(),
  };
  render(<ComposerBox {...props}>{children}</ComposerBox>);
  return props;
}

describe("ComposerBox", () => {
  it("is titled and its text area is labelled by the title", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Reply to @bob" })).toBeInTheDocument();
    expect(screen.getByLabelText("Reply to @bob")).toHaveValue("hi");
  });

  it("reports typing", () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByTestId("reply-input"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("posts and cancels", () => {
    const { onSubmit, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Post Reply" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows what it's given above the text area", () => {
    setup(<p>quoted preview</p>);
    expect(screen.getByText("quoted preview")).toBeInTheDocument();
  });
});
