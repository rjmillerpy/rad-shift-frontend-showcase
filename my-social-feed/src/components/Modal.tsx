"use client";

import React, { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useDismiss } from "@/hooks/useDismiss";

/** The one modal shell: a dimmed full-screen backdrop and a centred panel.

    Accessible by construction (it replaced six hand-rolled copies that only
    a mouse could close):
    - the panel is a labelled `role="dialog"` with `aria-modal`;
    - Escape closes it, the keyboard twin of clicking outside;
    - focus moves into the panel on open and back to where it was on close;
    - "click outside" is a document listener, so no bare div carries a click
      handler and the panel needs no stopPropagation. */

const DEFAULT_BACKDROP = "rgba(0,0,0,0.45)";
const DEFAULT_Z_INDEX = 9999;

interface Props {
  /** Read out by screen readers when the dialog opens. */
  label: string;
  onClose: () => void;
  panelStyle?: CSSProperties;
  backdropColor?: string;
  zIndex?: number;
  /** data-testid on the backdrop, for tests that look for the overlay. */
  testId?: string;
  children: ReactNode;
}

export default function Modal({
  label,
  onClose,
  panelStyle,
  backdropColor = DEFAULT_BACKDROP,
  zIndex = DEFAULT_Z_INDEX,
  testId,
  children,
}: Readonly<Props>) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useDismiss(panelRef, onClose);

  return (
    <div
      data-testid={testId}
      style={{
        position: "fixed",
        inset: 0,
        background: backdropColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{ outline: "none", ...panelStyle }}
      >
        {children}
      </div>
    </div>
  );
}
