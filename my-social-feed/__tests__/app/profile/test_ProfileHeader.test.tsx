import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileHeader from "@/app/profile/ProfileHeader";
import type { Profile } from "@/types/profile";

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  username: "testuser",
  bio: "Hello bio",
  profile_picture_url: "http://img.example.com/pic.jpg",
  posts: [],
  ...overrides,
});

type Handler = "onBioChange" | "onBioUpdate" | "onFileSelect" | "onImageUpload";
const ALL_HANDLERS: Handler[] = ["onBioChange", "onBioUpdate", "onFileSelect", "onImageUpload"];

const setup = (profile: Profile | null = makeProfile(), bio = "Hello bio") => {
  const handlers: Record<Handler, jest.Mock> = {
    onBioChange: jest.fn(),
    onBioUpdate: jest.fn(),
    onFileSelect: jest.fn(),
    onImageUpload: jest.fn(),
  };
  render(<ProfileHeader profile={profile} bio={bio} {...handlers} />);
  return handlers;
};

const expectOnly = (handlers: Record<Handler, jest.Mock>, called: Handler) => {
  for (const h of ALL_HANDLERS) expect(handlers[h]).toHaveBeenCalledTimes(h === called ? 1 : 0);
};

const fileInput = () => screen.getByLabelText(/Upload New Profile Picture/) as HTMLInputElement;
const bioInput = () => screen.getByLabelText(/Bio/);

describe("ProfileHeader", () => {
  it("shows the profile picture when the profile has one", () => {
    setup();
    expect(screen.getByAltText("Profile")).toHaveAttribute("src", "http://img.example.com/pic.jpg");
  });

  test.each<[string, Profile | null]>([
    ["the profile is still loading", null],
    ["the profile has no picture", makeProfile({ profile_picture_url: undefined })],
    ["the picture URL is empty", makeProfile({ profile_picture_url: "" })],
  ])("shows no picture but keeps the controls when %s", (_name, profile) => {
    setup(profile);
    expect(screen.queryByAltText("Profile")).not.toBeInTheDocument();
    expect(fileInput()).toBeInTheDocument();
    expect(bioInput()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Bio" })).toBeInTheDocument();
  });

  test.each(["Hello bio", "", "Line one\nLine two"])("shows the bio draft %j, not the saved profile bio", (bio) => {
    setup(makeProfile({ bio: "saved bio" }), bio);
    expect(bioInput()).toHaveValue(bio);
  });

  it("reports bio edits", () => {
    const handlers = setup();
    fireEvent.change(bioInput(), { target: { value: "A new bio" } });
    expect(handlers.onBioChange).toHaveBeenCalledWith("A new bio");
    expectOnly(handlers, "onBioChange");
  });

  test.each<[string, Handler]>([
    ["Update Bio", "onBioUpdate"],
    ["Upload", "onImageUpload"],
  ])("'%s' calls only %s", (name, handler) => {
    const handlers = setup();
    fireEvent.click(screen.getByRole("button", { name }));
    expectOnly(handlers, handler);
  });

  it("only accepts images in the file picker", () => {
    setup();
    expect(fileInput()).toHaveAttribute("type", "file");
    expect(fileInput()).toHaveAttribute("accept", "image/*");
  });

  it("reports the chosen file", () => {
    const handlers = setup();
    const file = new File(["png-bytes"], "avatar.png", { type: "image/png" });
    fireEvent.change(fileInput(), { target: { files: [file] } });
    expect(handlers.onFileSelect).toHaveBeenCalledWith(file);
    expectOnly(handlers, "onFileSelect");
  });

  it("reports only the first file when several are chosen", () => {
    const handlers = setup();
    const first = new File(["a"], "first.png", { type: "image/png" });
    const second = new File(["b"], "second.png", { type: "image/png" });
    fireEvent.change(fileInput(), { target: { files: [first, second] } });
    expect(handlers.onFileSelect).toHaveBeenCalledTimes(1);
    expect(handlers.onFileSelect).toHaveBeenCalledWith(first);
  });

  test.each<[string, File[] | null]>([
    ["cleared to an empty list", []],
    ["cleared to null", null],
  ])("reports null when the selection is %s", (_name, files) => {
    const handlers = setup();
    fireEvent.change(fileInput(), { target: { files } });
    expect(handlers.onFileSelect).toHaveBeenCalledTimes(1);
    expect(handlers.onFileSelect).toHaveBeenCalledWith(null);
  });
});
