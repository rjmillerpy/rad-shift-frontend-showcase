"use client";
import React, { useCallback, useState } from "react";
import type { Avatar, AvatarHalf } from "../data/schema";
import { AvatarSchema } from "../data/schema";
import HalfPicker from "./HalfPicker";
import AvatarPreview from "./AvatarPreview";
import { DEFAULT_HALF } from "./constants";

const PANEL_BG = "#ffffff";
const PANEL_BORDER = "#d0d7de";
const HEADING_COLOR = "#252423";
const HINT_COLOR = "#605e5c";
const SAVE_COLOR = "#217346";
const SAVE_DISABLED_COLOR = "#a3c0aa";

type Props = {
  initial?: Avatar;
  saving?: boolean;
  onSave: (avatar: Avatar) => Promise<void>;
  onCancel?: () => void;
};

/** Full character-creation overlay. Two HalfPickers + a live preview + a
    Save button. Validates the final avatar against Zod before calling
    onSave (rule 5). */
export default function CharacterCreator({ initial, saving = false, onSave, onCancel }: Props) {
  const seed: Avatar = initial ?? { left: DEFAULT_HALF, right: DEFAULT_HALF };
  const [left, setLeft] = useState<AvatarHalf>(seed.left);
  const [right, setRight] = useState<AvatarHalf>(seed.right);
  const [error, setError] = useState<string | null>(null);

  const setBothSides = useCallback((half: AvatarHalf) => {
    setLeft(half);
    setRight(half);
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    const parsed = AvatarSchema.safeParse({ left, right });
    if (!parsed.success) {
      setError("Please pick every option before saving.");
      return;
    }
    await onSave(parsed.data);
  }, [left, right, onSave]);

  const avatarForPreview: Avatar = { left, right };

  return (
    <div
      data-testid="amble-character-creator"
      style={{
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: 12,
        padding: 24,
        maxWidth: 900,
        margin: "40px auto",
        display: "flex",
        gap: 24,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <HalfPicker side="left" half={left} onChange={setLeft} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <h2 style={{ color: HEADING_COLOR, margin: 0, fontSize: 18 }}>Your Avatar</h2>
        <AvatarPreview avatar={avatarForPreview} />
        <QuickstartRow onMatchLeftToRight={() => setBothSides(left)} onMatchRightToLeft={() => setBothSides(right)} />
        {error && <div data-testid="amble-creator-error" style={{ color: "#c81c1c", fontSize: 13 }}>{error}</div>}
        <SaveRow saving={saving} onSave={handleSave} onCancel={onCancel} />
        <p style={{ color: HINT_COLOR, fontSize: 11, textAlign: "center", maxWidth: 280 }}>
          Each side is independent — mix and match to make a &ldquo;half-and-half&rdquo; avatar, or use
          the buttons above to mirror one side onto the other.
        </p>
      </div>

      <HalfPicker side="right" half={right} onChange={setRight} />
    </div>
  );
}

function QuickstartRow({
  onMatchLeftToRight,
  onMatchRightToLeft,
}: {
  onMatchLeftToRight: () => void;
  onMatchRightToLeft: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        data-testid="amble-creator-match-left-to-right"
        onClick={onMatchLeftToRight}
        style={secondaryButtonStyle}
      >
        Copy ← to →
      </button>
      <button
        type="button"
        data-testid="amble-creator-match-right-to-left"
        onClick={onMatchRightToLeft}
        style={secondaryButtonStyle}
      >
        Copy → to ←
      </button>
    </div>
  );
}

function SaveRow({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel?: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {onCancel !== undefined && (
        <button type="button" data-testid="amble-creator-cancel" onClick={onCancel} style={secondaryButtonStyle}>
          Cancel
        </button>
      )}
      <button
        type="button"
        data-testid="amble-creator-save"
        onClick={onSave}
        disabled={saving}
        style={{
          background: saving ? SAVE_DISABLED_COLOR : SAVE_COLOR,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 20px",
          fontSize: 14,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save avatar"}
      </button>
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  background: "#f3f2f1",
  color: "#252423",
  border: "1px solid #d0d7de",
  borderRadius: 4,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
};
