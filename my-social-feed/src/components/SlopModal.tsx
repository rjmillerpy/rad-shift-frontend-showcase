"use client";
import { useState } from "react";
import Modal from "@/components/Modal";

const SLOP_OPTIONS = [
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
] as const;

type SlopOption = (typeof SLOP_OPTIONS)[number];

type SlopModalProps = {
  postId: number;
  onSubmit: (postId: number, reason: string) => Promise<void> | void;
  onClose: () => void;
};

export default function SlopModal({ postId, onSubmit, onClose }: SlopModalProps) {
  const [choice, setChoice] = useState<SlopOption>("AI");
  const [otherText, setOtherText] = useState("");

  const reasonString =
    choice === "Other" && otherText.trim()
      ? `Other: ${otherText.trim()}`
      : choice;

  return (
    <Modal
      label="Mark post as slop"
      onClose={onClose}
      panelStyle={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        minWidth: 260,
        maxWidth: 340,
      }}
    >
      <h4 style={{ marginTop: 0 }}>Mark as Slop</h4>
      <select
        value={choice}
        onChange={(e) => setChoice(e.target.value as SlopOption)}
        style={{ width: "100%", padding: 6, marginBottom: 8 }}
      >
        {SLOP_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {choice === "Other" && (
        <input
          type="text"
          placeholder="Describe..."
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          style={{ width: "100%", padding: 6, marginBottom: 8 }}
        />
      )}
      <button
        onClick={async () => {
          await onSubmit(postId, reasonString);
          onClose();
        }}
        style={{
          width: "100%",
          padding: 8,
          background: "#c0392b",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Submit
      </button>
    </Modal>
  );
}
