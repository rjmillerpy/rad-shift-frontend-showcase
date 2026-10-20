"use client";
import React, { useEffect, useRef } from "react";
import type { Avatar } from "../data/schema";
import { composeAvatarToCanvas } from "./composeAvatar";
import { PREVIEW_HEIGHT_PX, PREVIEW_WIDTH_PX } from "./constants";

const BORDER_COLOR = "#d0d7de";
const BORDER_RADIUS_PX = 8;

type Props = {
  avatar: Avatar;
  scale?: number;
};

/** Renders the current avatar to an off-DOM canvas via composeAvatarToCanvas.
    Framework glue only — all drawing logic lives in the pure function (rule 7). */
export default function AvatarPreview({ avatar, scale = 2 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current === null) return;
    composeAvatarToCanvas(canvasRef.current, avatar);
  }, [avatar]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="amble-avatar-preview"
      width={PREVIEW_WIDTH_PX}
      height={PREVIEW_HEIGHT_PX}
      style={{
        width: PREVIEW_WIDTH_PX * scale,
        height: PREVIEW_HEIGHT_PX * scale,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: BORDER_RADIUS_PX,
        imageRendering: "pixelated",
        display: "block",
        background: "#fff",
      }}
    />
  );
}
