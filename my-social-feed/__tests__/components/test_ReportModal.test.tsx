import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportModal from "@/components/ReportModal";

const EXPECTED_OPTIONS = [
  "Harassment or Bullying",
  "Hate Speech",
  "Violence or Threats",
  "Spam or Scam",
  "Impersonation",
  "Doxxing / Private Information",
  "CSAM / Child Safety",
  "Self-Harm or Suicide",
  "Non-Consensual Intimate Images",
  "Illegal Activity",
  "Other",
];

const defaultProps = {
  postId: 99,
  onSubmit: jest.fn(),
  onClose: jest.fn(),
};

describe("ReportModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with all report options", () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText("Report Post")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.textContent
    );
    expect(options).toEqual(EXPECTED_OPTIONS);
  });

  it("calls onSubmit with reason string when submitted", async () => {
    const onSubmit = jest.fn();
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Hate Speech" },
    });
    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(99, "Hate Speech");
    });
  });

  it("calls onClose when the backdrop is pressed", () => {
    render(<ReportModal {...defaultProps} />);

    const backdrop = screen
      .getByText("Report Post")
      .closest('div[style*="position: fixed"]')!;
    fireEvent.pointerDown(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("closes on Escape, and labels its fields", () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByRole("dialog", { name: "Report post" })).toBeInTheDocument();
    expect(screen.getByLabelText("Reason")).toBeInstanceOf(HTMLSelectElement);
    expect(screen.getByLabelText(/Additional details/)).toBeInstanceOf(HTMLTextAreaElement);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("requires details when 'Other' selected and shows alert if empty", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const onSubmit = jest.fn();
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Other" },
    });
    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Please provide details for your report."
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it("includes details in reason string when details provided", async () => {
    const onSubmit = jest.fn();
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/Provide context/);
    await userEvent.type(textarea, "Threatening messages");
    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        99,
        "Harassment or Bullying: Threatening messages"
      );
    });
  });

  it("submits 'Other' with details as 'Other: <details>'", async () => {
    const onSubmit = jest.fn();
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Other" },
    });
    const textarea = screen.getByPlaceholderText(/Provide context/);
    await userEvent.type(textarea, "Custom report reason");
    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(99, "Other: Custom report reason");
    });
  });

  it("does not close modal when inner content is clicked", () => {
    render(<ReportModal {...defaultProps} />);
    fireEvent.pointerDown(screen.getByText("Report Post"));
    fireEvent.click(screen.getByText("Report Post"));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("shows warning text about false reports", () => {
    render(<ReportModal {...defaultProps} />);
    expect(
      screen.getByText(/False reports may result in/)
    ).toBeInTheDocument();
  });

  it("labels details as required when 'Other' is selected", () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText(/\(optional\)/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Other" },
    });

    expect(screen.getByText(/\(required\)/)).toBeInTheDocument();
  });
});
