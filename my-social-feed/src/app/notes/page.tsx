"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type QueuedNote = {
  id: number;
  post_id: number;
  text: string;
  source_url: string | null;
};

const LOAD_ERROR = "Couldn't load notes. Try again in a moment.";
const RATE_ERROR = "Couldn't save that rating. Try again.";

/**
 * Community notes waiting for ratings. A note only appears on its post once
 * people who usually disagree both rate it helpful, so every rating counts.
 */
export default function NotesPage() {
  const [notes, setNotes] = useState<QueuedNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await api.get<{ notes: QueuedNote[] }>("/notes/needs-ratings");
      setNotes(response.data.notes);
    } catch {
      setError(LOAD_ERROR);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function rate(noteId: number, helpful: boolean) {
    setError(null);
    try {
      await api.post(`/notes/${noteId}/rating`, { helpful });
      setNotes((current) => (current ?? []).filter((note) => note.id !== noteId));
    } catch {
      setError(RATE_ERROR);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h1>Rate community notes</h1>
      <p style={{ color: "#555" }}>
        Is this note helpful context for the post? A note shows on its post only when people who
        usually disagree with each other both say yes.
      </p>
      {error && <p role="alert" style={{ color: "#c0392b" }}>{error}</p>}
      {notes === null && !error && <p>Loading…</p>}
      {notes?.length === 0 && <p>Nothing to rate right now. Check back later.</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {notes?.map((note) => (
          <li key={note.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <p style={{ margin: "0 0 6px" }}>{note.text}</p>
            <p style={{ margin: "0 0 8px", fontSize: 12 }}>
              <Link href={`/post/${note.post_id}`}>See the post</Link>
              {note.source_url && (
                <>
                  {" · "}
                  <a href={note.source_url} target="_blank" rel="nofollow ugc noopener noreferrer">
                    Source
                  </a>
                </>
              )}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => rate(note.id, true)}>Helpful</button>
              <button type="button" onClick={() => rate(note.id, false)}>Not helpful</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
