import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlopModal from "@/components/SlopModal";

const EXPECTED_OPTIONS = [
  "AI",
  "Content Farm",
  "Cringe",
  "Echo Chamber",
  "Empty Commentary",
  "Engagement Bait",
  "Fake",
  "Pseudo-Authority",
  "Rage Bait",
  "Recycling",
  "Tired Trend",
  "Unethical Hoops",
  "Vagueposting",
  "Other",
];

const defaultProps = {
  postId: 42,
  onSubmit: jest.fn(),
  onClose: jest.fn(),
};

describe("SlopModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with all slop options in select", () => {
    render(<SlopModal {...defaultProps} />);

    expect(screen.getByText("Mark as Slop", { selector: "h4" })).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.textContent
    );
    expect(options).toEqual(EXPECTED_OPTIONS);
  });

  it("calls onSubmit with selected reason and postId when Submit clicked", async () => {
    const onSubmit = jest.fn();
    render(<SlopModal {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Engagement Bait" },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(42, "Engagement Bait");
    });
  });

  it("calls onClose when backdrop clicked", () => {
    render(<SlopModal {...defaultProps} />);

    const backdrop = screen
      .getByText("Mark as Slop", { selector: "h4" })
      .closest('div[style*="position: fixed"]')!;
    fireEvent.pointerDown(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows text input when 'Other' selected", () => {
    render(<SlopModal {...defaultProps} />);

    expect(screen.queryByPlaceholderText("Describe...")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Other" },
    });

    expect(screen.getByPlaceholderText("Describe...")).toBeInTheDocument();
  });

  it("includes custom text in reason when 'Other' selected", async () => {
    const onSubmit = jest.fn();
    render(<SlopModal {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Other" },
    });

    await userEvent.type(screen.getByPlaceholderText("Describe..."), "Custom reason");
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(42, "Other: Custom reason");
    });
  });

  test.each(EXPECTED_OPTIONS.filter((o) => o !== "Other"))(
    "submits reason '%s' directly without prefix",
    async (reason) => {
      const onSubmit = jest.fn();
      render(<SlopModal {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: reason },
      });
      fireEvent.click(screen.getByText("Submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(42, reason);
      });
    }
  );

  it("does not close modal when inner content is clicked", () => {
    render(<SlopModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Mark as Slop", { selector: "h4" }));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
