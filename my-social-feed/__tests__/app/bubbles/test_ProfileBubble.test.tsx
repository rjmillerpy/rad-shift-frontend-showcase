import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FloatingProfileBubble, PinnedProfileBubble } from "@/app/bubbles/ProfileBubble";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const DEFAULT_AVATAR_SRC = `/api/image-proxy?url=${encodeURIComponent("https://ui-avatars.com/api/?name=User")}`;

const avatarCases: Array<[string, string | null, string]> = [
  ["the default avatar when there is no picture", null, DEFAULT_AVATAR_SRC],
  ["a remote picture through the image proxy", "https://cdn.example.com/me.png",
    `/api/image-proxy?url=${encodeURIComponent("https://cdn.example.com/me.png")}`],
  ["a same-origin picture as-is", "/uploads/me.png", "/uploads/me.png"],
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FloatingProfileBubble", () => {
  const bubble = { x: 300, y: 200, vx: 0.2, vy: 0.15 };

  it("navigates to /profile when clicked", () => {
    render(<FloatingProfileBubble profilePic={null} bubble={bubble} />);
    fireEvent.click(screen.getByRole("button", { name: "Your profile" }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it.each(avatarCases)("shows %s", (_name, profilePic, expectedSrc) => {
    render(<FloatingProfileBubble profilePic={profilePic} bubble={bubble} />);
    expect(screen.getByAltText("Your profile")).toHaveAttribute("src", expectedSrc);
  });

  it.each([
    ["mid-screen", { x: 300, y: 200 }, "260px", "160px"],
    ["touching the top-left corner", { x: 40, y: 40 }, "0px", "0px"],
    ["fractional drift position", { x: 100.5, y: 50.25 }, "60.5px", "10.25px"],
  ])("is centred on its drift position — %s", (_name, pos, left, top) => {
    render(<FloatingProfileBubble profilePic={null} bubble={{ ...bubble, ...pos }} />);
    const { style } = screen.getByTitle("Your profile");
    expect(style.left).toBe(left);
    expect(style.top).toBe(top);
    expect(style.width).toBe("80px");
    expect(style.height).toBe("80px");
  });

  it("grows on hover and shrinks back on leave", () => {
    render(<FloatingProfileBubble profilePic={null} bubble={bubble} />);
    const button = screen.getByTitle("Your profile");
    fireEvent.mouseEnter(button);
    expect(button.style.transform).toBe("scale(1.15)");
    fireEvent.mouseLeave(button);
    expect(button.style.transform).toBe("scale(1)");
  });
});

describe("PinnedProfileBubble", () => {
  it("navigates to /profile when clicked", () => {
    render(<PinnedProfileBubble profilePic={null} />);
    fireEvent.click(screen.getByTestId("zoomed-profile-bubble"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it.each(avatarCases)("shows %s", (_name, profilePic, expectedSrc) => {
    render(<PinnedProfileBubble profilePic={profilePic} />);
    expect(screen.getByAltText("Your profile")).toHaveAttribute("src", expectedSrc);
  });

  it("is pinned to the bottom-left corner and smaller than the floating variant", () => {
    render(<PinnedProfileBubble profilePic={null} />);
    const { style } = screen.getByTestId("zoomed-profile-bubble");
    expect(style.left).toBe("20px");
    expect(style.bottom).toBe("20px");
    expect(style.width).toBe("60px");
    expect(style.height).toBe("60px");
  });

  it("grows on hover and shrinks back on leave", () => {
    render(<PinnedProfileBubble profilePic={null} />);
    const button = screen.getByTestId("zoomed-profile-bubble");
    fireEvent.mouseEnter(button);
    expect(button.style.transform).toBe("scale(1.15)");
    fireEvent.mouseLeave(button);
    expect(button.style.transform).toBe("scale(1)");
  });
});
