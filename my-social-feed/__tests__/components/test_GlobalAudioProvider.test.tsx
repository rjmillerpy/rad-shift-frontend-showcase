/**
 * Tests for src/components/GlobalAudioProvider.tsx — provides the global audio context.
 */
import React, { useContext } from "react";
import { render, screen } from "@testing-library/react";

import GlobalAudioProvider from "@/components/GlobalAudioProvider";
import { GlobalAudioContext } from "@/hooks/useGlobalAudio";


function ContextPeek() {
  const ctx = useContext(GlobalAudioContext);
  return <div data-testid="has-ctx">{ctx ? "yes" : "no"}</div>;
}


describe("GlobalAudioProvider", () => {
  test("renders its children", () => {
    render(
      <GlobalAudioProvider>
        <p>child-text</p>
      </GlobalAudioProvider>,
    );
    expect(screen.getByText("child-text")).toBeInTheDocument();
  });

  test("exposes a context value to descendant consumers", () => {
    render(
      <GlobalAudioProvider>
        <ContextPeek />
      </GlobalAudioProvider>,
    );
    expect(screen.getByTestId("has-ctx")).toHaveTextContent("yes");
  });

  test("mounts exactly one hidden <audio> element", () => {
    render(
      <GlobalAudioProvider>
        <p>ok</p>
      </GlobalAudioProvider>,
    );
    const audios = document.querySelectorAll("audio");
    expect(audios.length).toBe(1);
    expect((audios[0] as HTMLElement).style.display).toBe("none");
  });
});
