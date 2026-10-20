import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FeedTabs from "@/app/lame/FeedTabs";

describe("FeedTabs", () => {
  test.each([
    ["algo", "Algo"],
    ["following", "Following"],
    ["trending", "trending"],
  ])("labels the '%s' tab '%s'", (tab, labelText) => {
    render(<FeedTabs tabs={[tab]} activeTab="" onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: labelText })).toBeInTheDocument();
  });

  it("renders one button per tab, in the given order", () => {
    render(<FeedTabs tabs={["following", "algo", "trending"]} activeTab="algo" onChange={jest.fn()} />);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Following", "Algo", "trending"]);
  });

  it("renders no buttons without tabs", () => {
    render(<FeedTabs tabs={[]} activeTab="algo" onChange={jest.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test.each([
    ["Algo", "algo"],
    ["Following", "following"],
    ["trending", "trending"],
  ])("clicking '%s' reports the tab key '%s'", (labelText, tab) => {
    const onChange = jest.fn();
    render(<FeedTabs tabs={["algo", "following", "trending"]} activeTab="algo" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: labelText }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(tab);
  });

  it("reports a click on the already active tab too", () => {
    const onChange = jest.fn();
    render(<FeedTabs tabs={["algo", "following"]} activeTab="algo" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Algo" }));
    expect(onChange).toHaveBeenCalledWith("algo");
  });

  test.each([
    ["algo", "Algo", "Following"],
    ["following", "Following", "Algo"],
  ])("highlights only the active tab (%s)", (activeTab, active, inactive) => {
    render(<FeedTabs tabs={["algo", "following"]} activeTab={activeTab} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: active })).toHaveStyle({ backgroundColor: "#ccc" });
    expect(screen.getByRole("button", { name: inactive })).toHaveStyle({ backgroundColor: "#fff" });
  });
});
