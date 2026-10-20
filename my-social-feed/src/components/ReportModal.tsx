"use client";
import { useId, useState } from "react";
import Modal from "./Modal";

const REPORT_OPTIONS = [
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
] as const;

type ReportOption = (typeof REPORT_OPTIONS)[number];

type ReportModalProps = {
  postId: number;
  onSubmit: (postId: number, reason: string) => Promise<void> | void;
  onClose: () => void;
};

export default function ReportModal({ postId, onSubmit, onClose }: ReportModalProps) {
  const [choice, setChoice] = useState<ReportOption>("Harassment or Bullying");
  const [details, setDetails] = useState("");
  const fieldId = useId();

  const reasonString =
    choice === "Other" && details.trim()
      ? `Other: ${details.trim()}`
      : details.trim()
      ? `${choice}: ${details.trim()}`
      : choice;

  return (
    <Modal
      label="Report post"
      onClose={onClose}
      panelStyle={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        minWidth: 280,
        maxWidth: 380,
      }}
    >
        <h4 style={{ marginTop: 0, color: "#c0392b" }}>Report Post</h4>
        <p style={{ fontSize: 12, color: "#666", marginTop: 0 }}>
          Reports are reviewed by moderators. False reports may result in
          action against your account.
        </p>
        <label
          htmlFor={`${fieldId}-reason`}
          style={{
            fontSize: 12,
            fontWeight: "bold",
            display: "block",
            marginBottom: 4,
          }}
        >
          Reason
        </label>
        <select
          id={`${fieldId}-reason`}
          value={choice}
          onChange={(e) => setChoice(e.target.value as ReportOption)}
          style={{ width: "100%", padding: 6, marginBottom: 8 }}
        >
          {REPORT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <label
          htmlFor={`${fieldId}-details`}
          style={{
            fontSize: 12,
            fontWeight: "bold",
            display: "block",
            marginBottom: 4,
          }}
        >
          Additional details{" "}
          {choice !== "Other" ? "(optional)" : "(required)"}
        </label>
        <textarea
          id={`${fieldId}-details`}
          placeholder="Provide context to help moderators review this report..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: 6,
            marginBottom: 8,
            resize: "vertical",
            fontSize: 12,
          }}
        />
        <button
          onClick={async () => {
            if (choice === "Other" && !details.trim()) {
              alert("Please provide details for your report.");
              return;
            }
            await onSubmit(postId, reasonString);
            onClose();
            setDetails("");
            setChoice("Harassment or Bullying");
          }}
          style={{
            width: "100%",
            padding: 8,
            background: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Submit Report
        </button>
    </Modal>
  );
}
