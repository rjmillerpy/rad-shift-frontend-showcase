"use client";
import { useEffect, useRef, type RefObject } from "react";
import { storageListener, type WidgetStore } from "./bridge";

/** Answers radshift.storage calls from the iframe in the returned ref, from `store`. */
export function useWidgetStorage(store: WidgetStore): RefObject<HTMLIFrameElement | null> {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    const listener = storageListener(() => frameRef.current?.contentWindow, store);
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [store]);
  return frameRef;
}
