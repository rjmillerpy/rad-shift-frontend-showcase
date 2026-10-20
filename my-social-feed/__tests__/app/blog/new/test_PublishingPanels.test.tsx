import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MonetizationPanel, SchedulerPanel, SocialSharingPanel } from "@/app/blog/new/PublishingPanels";
import { OPTIMAL_TIMES } from "@/app/blog/new/constants";

describe("MonetizationPanel", () => {
  const setup = (monetized: boolean, adPlacement = "none") => {
    const handlers = { onMonetizedChange: jest.fn(), onAdPlacementChange: jest.fn() };
    render(<MonetizationPanel monetized={monetized} adPlacement={adPlacement} {...handlers} />);
    return handlers;
  };

  test.each([
    ["off", false],
    ["on", true],
  ])("when monetization is %s the toggle and the ad options follow", (_name, monetized) => {
    setup(monetized);
    expect((screen.getByTestId("monetize-toggle") as HTMLInputElement).checked).toBe(monetized);
    expect(!!screen.queryByTestId("ad-options")).toBe(monetized);
  });

  test.each([
    ["on", false, true],
    ["off", true, false],
  ])("switching monetization %s reports %s -> %s", (_name, initial, expected) => {
    const { onMonetizedChange, onAdPlacementChange } = setup(initial);
    fireEvent.click(screen.getByTestId("monetize-toggle"));
    expect(onMonetizedChange).toHaveBeenCalledTimes(1);
    expect(onMonetizedChange).toHaveBeenCalledWith(expected);
    expect(onAdPlacementChange).not.toHaveBeenCalled();
  });

  test.each([
    ["minimal", "Minimal (top + bottom)", "standard"],
    ["standard", "Standard (top + inline + bottom)", "minimal"],
  ])("the '%s' placement is labelled, selectable and reflects the current value", (placement, labelText, other) => {
    const { onAdPlacementChange } = setup(true, other);
    const radio = screen.getByRole("radio", { name: labelText });
    expect(radio).toBe(screen.getByTestId(`ad-${placement}`));
    expect(radio).not.toBeChecked();
    expect(screen.getByTestId(`ad-${other}`)).toBeChecked();

    fireEvent.click(radio);
    expect(onAdPlacementChange).toHaveBeenCalledTimes(1);
    expect(onAdPlacementChange).toHaveBeenCalledWith(placement);
  });

  it("selects neither placement while the value is something else", () => {
    setup(true, "none");
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
  });
});

describe("SocialSharingPanel", () => {
  const shareLinks = {
    twitter: "https://twitter.com/intent/tweet?url=x",
    facebook: "https://www.facebook.com/sharer/sharer.php?u=x",
    linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=x",
  };
  const setup = (autoShare: boolean) => {
    const onAutoShareChange = jest.fn();
    render(<SocialSharingPanel autoShare={autoShare} onAutoShareChange={onAutoShareChange} shareLinks={shareLinks} />);
    return { onAutoShareChange };
  };

  test.each([
    ["off", false],
    ["on", true],
  ])("when auto-share is %s the toggle and the share links follow", (_name, autoShare) => {
    setup(autoShare);
    expect((screen.getByTestId("auto-share") as HTMLInputElement).checked).toBe(autoShare);
    expect(!!screen.queryByTestId("share-links")).toBe(autoShare);
  });

  test.each([
    ["on", false, true],
    ["off", true, false],
  ])("switching auto-share %s reports %s -> %s", (_name, initial, expected) => {
    const { onAutoShareChange } = setup(initial);
    fireEvent.click(screen.getByTestId("auto-share"));
    expect(onAutoShareChange).toHaveBeenCalledTimes(1);
    expect(onAutoShareChange).toHaveBeenCalledWith(expected);
  });

  test.each([
    ["Twitter", shareLinks.twitter],
    ["Facebook", shareLinks.facebook],
    ["LinkedIn", shareLinks.linkedin],
  ])("links %s to its share URL in a new tab", (network, href) => {
    setup(true);
    const row = screen.getByText(`${network}:`, { exact: false });
    const link = within(row).getByRole("link", { name: "Share" });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("SchedulerPanel", () => {
  const setup = (scheduleEnabled: boolean, scheduleDate = "", scheduleTime = "") => {
    const handlers = {
      onScheduleEnabledChange: jest.fn(),
      onScheduleDateChange: jest.fn(),
      onScheduleTimeChange: jest.fn(),
    };
    render(
      <SchedulerPanel scheduleEnabled={scheduleEnabled} scheduleDate={scheduleDate} scheduleTime={scheduleTime} {...handlers} />,
    );
    return handlers;
  };

  test.each([
    ["off", false],
    ["on", true],
  ])("when scheduling is %s the toggle and the options follow", (_name, enabled) => {
    setup(enabled);
    expect((screen.getByTestId("schedule-toggle") as HTMLInputElement).checked).toBe(enabled);
    expect(!!screen.queryByTestId("schedule-options")).toBe(enabled);
  });

  test.each([
    ["on", false, true],
    ["off", true, false],
  ])("switching scheduling %s reports %s -> %s", (_name, initial, expected) => {
    const { onScheduleEnabledChange } = setup(initial);
    fireEvent.click(screen.getByTestId("schedule-toggle"));
    expect(onScheduleEnabledChange).toHaveBeenCalledTimes(1);
    expect(onScheduleEnabledChange).toHaveBeenCalledWith(expected);
  });

  it("shows the chosen date and time", () => {
    setup(true, "2026-11-03", "10:00");
    expect(screen.getByTestId("schedule-date")).toHaveValue("2026-11-03");
    expect(screen.getByTestId("schedule-time")).toHaveValue("10:00");
  });

  test.each([
    ["schedule-date", "onScheduleDateChange", "onScheduleTimeChange", "2026-12-24"],
    ["schedule-time", "onScheduleTimeChange", "onScheduleDateChange", "14:30"],
  ] as const)("changing %s calls only %s", (testId, called, notCalled, value) => {
    const handlers = setup(true, "2026-11-03", "10:00");
    fireEvent.change(screen.getByTestId(testId), { target: { value } });
    expect(handlers[called]).toHaveBeenCalledTimes(1);
    expect(handlers[called]).toHaveBeenCalledWith(value);
    expect(handlers[notCalled]).not.toHaveBeenCalled();
    expect(handlers.onScheduleEnabledChange).not.toHaveBeenCalled();
  });

  it("lists every optimal posting time with its reason", () => {
    setup(true);
    const options = screen.getByTestId("schedule-options");
    for (const t of OPTIMAL_TIMES) {
      const slot = within(options).getByText(`${t.day} ${t.time}`);
      expect(slot.parentElement).toHaveTextContent(`${t.day} ${t.time} — ${t.reason}`);
    }
  });
});
