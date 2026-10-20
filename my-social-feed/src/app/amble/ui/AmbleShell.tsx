"use client";
import React, { useCallback, useState } from "react";
import AmbleGameView from "./AmbleGameView";
import DialogueFrame from "./DialogueFrame";
import HUD from "./HUD";
import CharacterCreator from "../character/CharacterCreator";
import { useAvatar } from "../hooks/useAvatar";
import type { Avatar } from "../data/schema";

const OVERLAY_BG = "#1a1a2e";
const STATUS_TEXT_COLOR = "#c8c6c4";
const LOADING_MESSAGE = "Loading your character…";
const ERROR_MESSAGE = "Couldn't load your character. Try refreshing.";

/**
 * Composition shell for the Amble feed:
 *   - Fetches the current user's avatar via useAvatar
 *   - Missing → CharacterCreator (CHAR-01)
 *   - Ready   → AmbleGameView + HUD (with re-open creator, CHAR-06)
 *
 * Purely framework glue — all data logic is in `useAvatar` (rule 7).
 */
export default function AmbleShell() {
  const { status, avatar, error, saving, saveAvatar } = useAvatar();
  const [editing, setEditing] = useState(false);

  const openEditor = useCallback(() => setEditing(true), []);
  const closeEditor = useCallback(() => setEditing(false), []);

  const handleSave = useCallback(
    async (next: Avatar) => {
      await saveAvatar(next);
      setEditing(false);
    },
    [saveAvatar],
  );

  if (status === "loading") return <StatusScreen testid="amble-shell-loading" text={LOADING_MESSAGE} />;
  if (status === "error") return <StatusScreen testid="amble-shell-error" text={error ?? ERROR_MESSAGE} />;

  // First-time users must create an avatar before entering the world.
  if (status === "missing" || avatar === null) {
    return (
      <CharacterCreator saving={saving} onSave={handleSave} />
    );
  }

  // Ready state — user has an avatar. HUD lets them re-open the creator.
  if (editing) {
    return (
      <CharacterCreator
        initial={avatar}
        saving={saving}
        onSave={handleSave}
        onCancel={closeEditor}
      />
    );
  }

  return (
    <div data-testid="amble-shell-world" style={{ position: "relative" }}>
      <AmbleGameView />
      <HUD onEditAvatar={openEditor} />
      <DialogueFrame />
    </div>
  );
}

function StatusScreen({ testid, text }: { testid: string; text: string }) {
  return (
    <div
      data-testid={testid}
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: OVERLAY_BG,
        color: STATUS_TEXT_COLOR,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}
