"use client";
import { useCallback, useRef, useState } from "react";
import { usePhaserGame } from "../hooks/usePhaserGame";
import {
  BOOTSTRAP_ERROR_MESSAGE,
  CAMERA_ZOOM,
  CAMERA_ZOOM_EVENT,
  CAMERA_ZOOM_OVERVIEW,
  COORDINATE_AXES_DEFAULT_VISIBLE,
  COORDINATE_AXES_TOGGLE_EVENT,
  LOADING_MESSAGE,
  PHASER_HEIGHT_PX,
  PHASER_WIDTH_PX,
} from "../data/constants";

const OVERLAY_TEXT_COLOR = "#605e5c";

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: OVERLAY_TEXT_COLOR,
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
};

const zoomButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  padding: "6px 10px",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  border: "1px solid #605e5c",
  borderRadius: 6,
  background: "rgba(255, 255, 255, 0.9)",
  color: "#333",
  cursor: "pointer",
  zIndex: 10,
};

// Coord toggle sits just below the zoom button, same style.
const coordButtonStyle: React.CSSProperties = {
  ...({} as React.CSSProperties),
  position: "absolute",
  top: 48,
  right: 12,
  padding: "6px 10px",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  border: "1px solid #605e5c",
  borderRadius: 6,
  background: "rgba(255, 255, 255, 0.9)",
  color: "#333",
  cursor: "pointer",
  zIndex: 10,
};

/** React shell that owns the DOM node Phaser attaches to. Rendering, overlays,
    and status come from `usePhaserGame` (rule 7). */
export default function AmbleGameView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { status, error } = usePhaserGame(hostRef);
  const [overview, setOverview] = useState(false);
  const [coordsVisible, setCoordsVisible] = useState(COORDINATE_AXES_DEFAULT_VISIBLE);

  const toggleZoom = useCallback(() => {
    const next = !overview;
    setOverview(next);
    window.dispatchEvent(
      new CustomEvent(CAMERA_ZOOM_EVENT, {
        detail: { zoom: next ? CAMERA_ZOOM_OVERVIEW : CAMERA_ZOOM },
      }),
    );
  }, [overview]);

  const toggleCoords = useCallback(() => {
    const next = !coordsVisible;
    setCoordsVisible(next);
    window.dispatchEvent(
      new CustomEvent(COORDINATE_AXES_TOGGLE_EVENT, {
        detail: { visible: next },
      }),
    );
  }, [coordsVisible]);

  return (
    <div
      data-testid="amble-canvas-host"
      ref={hostRef}
      style={{
        width: PHASER_WIDTH_PX,
        height: PHASER_HEIGHT_PX,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {status === "loading" && (
        <div data-testid="amble-loading" style={overlayStyle}>
          {LOADING_MESSAGE}
        </div>
      )}
      {status === "error" && (
        <div data-testid="amble-error" style={overlayStyle}>
          {error ?? BOOTSTRAP_ERROR_MESSAGE}
        </div>
      )}
      {status === "ready" && (
        <>
          <button
            type="button"
            onClick={toggleZoom}
            style={zoomButtonStyle}
            data-testid="amble-zoom-toggle"
          >
            {overview ? `zoom to ${CAMERA_ZOOM}×` : "zoom out"}
          </button>
          <button
            type="button"
            onClick={toggleCoords}
            style={coordButtonStyle}
            data-testid="amble-coords-toggle"
          >
            {coordsVisible ? "hide coords" : "show coords"}
          </button>
        </>
      )}
    </div>
  );
}
