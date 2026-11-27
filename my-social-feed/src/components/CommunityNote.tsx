"use client";
import { useId, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { CommunityNoteSummary } from "@/types/post";

// Matches the backend's MAX_NOTE_LENGTH (app/community_notes/constants.py).
export const MAX_NOTE_LENGTH = 500;

type CommunityNoteProps = {
  postId: number;
  note: CommunityNoteSummary | null | undefined;
  // Only signed-in readers who didn't write the post can add context.
  canAddNote: boolean;
};

/** "Readers added context" under a post, and the form to suggest a note. */
export default function CommunityNote({ postId, note, canAddNote }: CommunityNoteProps) {
  const [writing, setWriting] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div style={{ margin: "6px 0 0 5px" }}>
      {note && <ShownNote note={note} />}
      {canAddNote && !sent && !writing && (
        <button type="button" onClick={() => setWriting(true)} style={linkButton}>
          Add context
        </button>
      )}
      {writing && (
        <NoteForm
          postId={postId}
          onDone={() => {
            setWriting(false);
            setSent(true);
          }}
          onCancel={() => setWriting(false)}
        />
      )}
      {sent && (
        <p role="status" style={{ fontSize: 12, color: "#555" }}>
          Thanks. Your note shows once people who usually disagree both rate it helpful.{" "}
          <Link href="/notes">Rate other notes</Link>
        </p>
      )}
    </div>
  );
}

function ShownNote({ note }: { note: CommunityNoteSummary }) {
  return (
    <aside
      aria-label="Readers added context"
      style={{ border: "1px solid #d0d7de", borderRadius: 8, padding: "8px 10px", background: "#f6f8fa" }}
    >
      <strong style={{ fontSize: 13 }}>Readers added context</strong>
      <p style={{ margin: "4px 0", fontSize: 14 }}>{note.text}</p>
      {note.source_url && (
        // A reader-supplied link: no referrer, and no ranking credit for it.
        <a href={note.source_url} target="_blank" rel="nofollow ugc noopener noreferrer" style={{ fontSize: 12 }}>
          Source
        </a>
      )}
    </aside>
  );
}

function NoteForm({ postId, onDone, onCancel }: { postId: number; onDone: () => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/notes/posts/${postId}`, { text: text.trim(), source_url: sourceUrl.trim() || null });
      onDone();
    } catch {
      setError("Couldn't add the note. Check the link starts with http:// or https://.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 6, maxWidth: 420 }}>
      <label htmlFor={`${id}-text`} style={{ fontSize: 12, fontWeight: "bold" }}>
        Context for other readers
      </label>
      <textarea
        id={`${id}-text`}
        value={text}
        maxLength={MAX_NOTE_LENGTH}
        rows={3}
        onChange={(event) => setText(event.target.value)}
      />
      <label htmlFor={`${id}-source`} style={{ fontSize: 12, fontWeight: "bold" }}>
        Source link (optional)
      </label>
      <input
        id={`${id}-source`}
        type="url"
        value={sourceUrl}
        placeholder="https://"
        onChange={(event) => setSourceUrl(event.target.value)}
      />
      {error && (
        <p role="alert" style={{ color: "#c0392b", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy || !text.trim()}>
          Add note
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const linkButton: React.CSSProperties = {
  border: "none",
  background: "none",
  cursor: "pointer",
  padding: 0,
  fontSize: 12,
  color: "#007bff",
};
