"use client";
import React, { useCallback } from "react";
import type { AvatarHalf } from "../data/schema";
import AttributeSwatch from "./AttributeSwatch";
import {
  ATTRIBUTE_GROUP_LABELS,
  CLOTHING_COLORS,
  CLOTHING_IDS,
  GENDER_IDS,
  HAIRSTYLE_COLORS,
  HAIRSTYLE_IDS,
  SKIN_TONE_COLORS,
  SKIN_TONE_IDS,
  type ClothingId,
  type GenderId,
  type HairstyleId,
  type SkinToneId,
} from "./constants";

const GENDER_PLACEHOLDER_COLOR: Record<GenderId, string> = {
  boy: "#a3c9ff",
  girl: "#ffb3d1",
};

type Props = {
  side: "left" | "right";
  half: AvatarHalf;
  onChange: (next: AvatarHalf) => void;
};

/** Renders the four attribute rows for a single avatar half. Selecting a
    swatch calls onChange with an immutably-updated half (rule 12). */
export default function HalfPicker({ side, half, onChange }: Props) {
  const pickGender = useCallback(
    (id: string) => onChange({ ...half, gender: id as GenderId }),
    [half, onChange],
  );
  const pickSkin = useCallback(
    (id: string) => onChange({ ...half, skin_tone: id as SkinToneId }),
    [half, onChange],
  );
  const pickHair = useCallback(
    (id: string) => onChange({ ...half, hairstyle: id as HairstyleId }),
    [half, onChange],
  );
  const pickClothing = useCallback(
    (id: string) => onChange({ ...half, clothing: id as ClothingId }),
    [half, onChange],
  );

  return (
    <div data-testid={`amble-half-picker-${side}`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Row label={ATTRIBUTE_GROUP_LABELS.gender}>
        {GENDER_IDS.map((id) => (
          <AttributeSwatch
            key={id}
            id={`${side}-gender-${id}`}
            color={GENDER_PLACEHOLDER_COLOR[id]}
            selected={half.gender === id}
            onSelect={() => pickGender(id)}
            label={`${id} (${side})`}
          />
        ))}
      </Row>

      <Row label={ATTRIBUTE_GROUP_LABELS.skin_tone}>
        {SKIN_TONE_IDS.map((id) => (
          <AttributeSwatch
            key={id}
            id={`${side}-skin-${id}`}
            color={SKIN_TONE_COLORS[id]}
            selected={half.skin_tone === id}
            onSelect={() => pickSkin(id)}
            label={`${id} skin (${side})`}
          />
        ))}
      </Row>

      <Row label={ATTRIBUTE_GROUP_LABELS.hairstyle}>
        {HAIRSTYLE_IDS.map((id) => (
          <AttributeSwatch
            key={id}
            id={`${side}-hair-${id}`}
            color={HAIRSTYLE_COLORS[id]}
            selected={half.hairstyle === id}
            onSelect={() => pickHair(id)}
            label={`${id} hair (${side})`}
          />
        ))}
      </Row>

      <Row label={ATTRIBUTE_GROUP_LABELS.clothing}>
        {CLOTHING_IDS.map((id) => (
          <AttributeSwatch
            key={id}
            id={`${side}-clothing-${id}`}
            color={CLOTHING_COLORS[id]}
            selected={half.clothing === id}
            onSelect={() => pickClothing(id)}
            label={`${id} clothing (${side})`}
          />
        ))}
      </Row>
    </div>
  );
}

const ROW_LABEL_COLOR = "#605e5c";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: ROW_LABEL_COLOR, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}
