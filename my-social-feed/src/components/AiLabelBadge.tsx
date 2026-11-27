import type { AiLabel } from "@/types/post";

// Says who labelled it, so a reader can weigh the label.
const REASONS: Record<AiLabel, string> = {
  author: "The author says this was made with AI.",
  content_credentials: "This post's image says in its own data that it was made by AI.",
  moderator: "A moderator labelled this as made with AI.",
};

/** The "AI-generated" label on a post, with why it carries it. */
export default function AiLabelBadge({ label }: { label: AiLabel | null | undefined }) {
  if (!label) return null;
  return (
    <p
      style={{
        display: "inline-block",
        margin: "4px 0 4px 5px",
        padding: "2px 8px",
        borderRadius: 10,
        background: "#eef2ff",
        color: "#3730a3",
        fontSize: 12,
      }}
    >
      AI-generated <span style={{ color: "#555" }}>· {REASONS[label]}</span>
    </p>
  );
}
