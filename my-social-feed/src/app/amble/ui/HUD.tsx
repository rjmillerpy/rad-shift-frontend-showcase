"use client";
import React, { useEffect, useState } from "react";
import {
  AMBLE_ENGAGEMENT_EVENT,
  DIALOGUE_CLOSE_EVENT,
  DIALOGUE_OPEN_EVENT,
  INTERACT_HINT_EVENT,
  INTERACT_HINT_LABEL,
} from "../data/constants";

const HUD_BG = "rgba(37, 36, 35, 0.85)";
const HUD_TEXT = "#ffffff";
const HUD_BORDER = "rgba(255,255,255,0.15)";
const HINT_BG = "rgba(37, 36, 35, 0.9)";
const HINT_ACCENT = "#f9c74f";

type Props = {
  onEditAvatar: () => void;
};

/** Small in-game HUD anchored to the top-left of the game canvas.
    Currently exposes the "Edit avatar" affordance (CHAR-06) plus the
    interact-hint prompt (MOVE-03: interactables must be visually
    discoverable). The hint appears near the bottom-centre when the scene
    reports an adjacent entity and hides while the dialogue is open. */
export default function HUD({ onEditAvatar }: Props) {
  const [hintEntityId, setHintEntityId] = useState<string | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [engagementCount, setEngagementCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHint = (event: Event) => {
      const detail = (event as CustomEvent<{ entityId: string | null }>).detail;
      setHintEntityId(detail?.entityId ?? null);
    };
    const onOpen = () => setDialogueOpen(true);
    const onClose = () => setDialogueOpen(false);
    const onEngage = () => setEngagementCount((n) => n + 1);
    window.addEventListener(INTERACT_HINT_EVENT, onHint);
    window.addEventListener(DIALOGUE_OPEN_EVENT, onOpen);
    window.addEventListener(DIALOGUE_CLOSE_EVENT, onClose);
    window.addEventListener(AMBLE_ENGAGEMENT_EVENT, onEngage);
    return () => {
      window.removeEventListener(INTERACT_HINT_EVENT, onHint);
      window.removeEventListener(DIALOGUE_OPEN_EVENT, onOpen);
      window.removeEventListener(DIALOGUE_CLOSE_EVENT, onClose);
      window.removeEventListener(AMBLE_ENGAGEMENT_EVENT, onEngage);
    };
  }, []);

  const showHint = hintEntityId !== null && !dialogueOpen;

  return (
    <>
      {showHint && (
        <div
          data-testid="amble-interact-hint"
          style={{
            position: "absolute",
            bottom: 96,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 12px",
            background: HINT_BG,
            color: HUD_TEXT,
            border: `1px solid ${HINT_ACCENT}`,
            borderRadius: 6,
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          <span style={{ color: HINT_ACCENT, marginRight: 6 }}>◆</span>
          {INTERACT_HINT_LABEL}
        </div>
      )}
      <div
        data-testid="amble-hud"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "6px 10px",
          background: HUD_BG,
          color: HUD_TEXT,
          border: `1px solid ${HUD_BORDER}`,
          borderRadius: 6,
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          zIndex: 5,
        }}
      >
        <button
          type="button"
          data-testid="amble-hud-edit-avatar"
          onClick={onEditAvatar}
          style={{
            background: "transparent",
            border: "none",
            color: HUD_TEXT,
            cursor: "pointer",
            padding: 0,
            fontSize: 12,
            textDecoration: "underline",
          }}
        >
          Edit avatar
        </button>
        <span
          data-testid="amble-hud-engagement-count"
          title="Engagements this session"
          style={{
            color: HINT_ACCENT,
            marginLeft: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ◆ {engagementCount}
        </span>
      </div>
    </>
  );
}
