import React from "react";
import { render, screen } from "@testing-library/react";
import AvatarPreview from "@/app/amble/character/AvatarPreview";
import { DEFAULT_HALF, PREVIEW_HEIGHT_PX, PREVIEW_WIDTH_PX } from "@/app/amble/character/constants";
import type { Avatar } from "@/app/amble/data/schema";

const AVATAR: Avatar = { left: DEFAULT_HALF, right: DEFAULT_HALF };

describe("AvatarPreview", () => {
  it("renders a canvas at the configured logical dimensions", () => {
    render(<AvatarPreview avatar={AVATAR} />);
    const canvas = screen.getByTestId("amble-avatar-preview") as HTMLCanvasElement;
    expect(canvas.width).toBe(PREVIEW_WIDTH_PX);
    expect(canvas.height).toBe(PREVIEW_HEIGHT_PX);
  });

  it("scales the CSS size by the scale prop", () => {
    render(<AvatarPreview avatar={AVATAR} scale={3} />);
    const canvas = screen.getByTestId("amble-avatar-preview") as HTMLCanvasElement;
    expect(canvas.style.width).toBe(`${PREVIEW_WIDTH_PX * 3}px`);
    expect(canvas.style.height).toBe(`${PREVIEW_HEIGHT_PX * 3}px`);
  });

  it("re-runs composition when the avatar prop changes", () => {
    const { rerender } = render(<AvatarPreview avatar={AVATAR} />);
    const canvas = screen.getByTestId("amble-avatar-preview") as HTMLCanvasElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = canvas.getContext("2d") as any;
    const before = ctx.__getEvents().length;
    rerender(
      <AvatarPreview
        avatar={{ ...AVATAR, right: { ...DEFAULT_HALF, hairstyle: "long" } }}
      />,
    );
    expect(ctx.__getEvents().length).toBeGreaterThan(before);
  });
});
