import { useEffect, type RefObject } from "react";

/** Close something (a dialog, a menu) on Escape or on a press outside it.

    Document listeners rather than a click-catching backdrop: no bare <div>
    needs a click handler, the content needs no stopPropagation, and the
    keyboard gets the same way out as the mouse. */
export function useDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [ref, onDismiss]);
}
