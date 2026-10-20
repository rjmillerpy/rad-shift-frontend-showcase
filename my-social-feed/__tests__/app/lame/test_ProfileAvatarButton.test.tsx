import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileAvatarButton from "@/app/lame/ProfileAvatarButton";
import { HEX_AVATAR_CLIP } from "@/app/lame/constants";
import { DEFAULT_AVATAR } from "@/lib/config";

const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

describe("ProfileAvatarButton", () => {
  test.each<[string, string | null, string]>([
    ["the default avatar when there is no picture", null, proxied(DEFAULT_AVATAR)],
    ["the default avatar for an empty picture URL", "", proxied(DEFAULT_AVATAR)],
    ["a remote picture through the image proxy", "https://cdn.example.com/me.png", proxied("https://cdn.example.com/me.png")],
    ["a same-origin picture as is", "/uploads/me.png", "/uploads/me.png"],
  ])("shows %s", (_name, profilePic, src) => {
    render(<ProfileAvatarButton profilePic={profilePic} onClick={jest.fn()} />);
    expect(screen.getByAltText("Profile")).toHaveAttribute("src", src);
  });

  it("calls onClick when the avatar is clicked", () => {
    const onClick = jest.fn();
    render(<ProfileAvatarButton profilePic={null} onClick={onClick} />);
    fireEvent.click(screen.getByAltText("Profile"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is clipped to the shared hexagon and loads cross-origin safely", () => {
    render(<ProfileAvatarButton profilePic={null} onClick={jest.fn()} />);
    const avatar = screen.getByAltText("Profile");
    expect(avatar.style.clipPath).toBe(HEX_AVATAR_CLIP);
    expect(avatar).toHaveAttribute("crossorigin", "anonymous");
    expect(avatar).toHaveStyle({ cursor: "pointer" });
  });
});
