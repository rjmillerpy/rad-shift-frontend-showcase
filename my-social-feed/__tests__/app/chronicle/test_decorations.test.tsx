import React from "react";
import { render, screen } from "@testing-library/react";
import { ChapterDivider, DropCap, PageNumber } from "@/app/chronicle/decorations";

describe("DropCap", () => {
  it.each(["A", "z", "É", "“"])("renders the letter %s floated left and enlarged", (letter) => {
    render(<p>
      <DropCap letter={letter} />
      rest of the sentence
    </p>);
    const cap = screen.getByText(letter);
    expect(cap.tagName).toBe("SPAN");
    expect(cap.style.cssFloat).toBe("left");
    expect(parseInt(cap.style.fontSize, 10)).toBeGreaterThan(40);
    expect(cap.style.fontWeight).toBe("bold");
  });

  it("renders only the letter it is given", () => {
    const { container } = render(<DropCap letter="Q" />);
    expect(container.textContent).toBe("Q");
  });
});

describe("ChapterDivider", () => {
  it("renders a centred three-star ornament", () => {
    render(<ChapterDivider />);
    const divider = screen.getByText("✦ ✦ ✦");
    expect(divider.style.textAlign).toBe("center");
  });

  it("renders the same ornament every time", () => {
    const { container } = render(<><ChapterDivider /><ChapterDivider /></>);
    expect(container.textContent).toBe("✦ ✦ ✦✦ ✦ ✦");
  });
});

describe("PageNumber", () => {
  it.each([
    ["first page", 1, "— 1 —"],
    ["double digits", 12, "— 12 —"],
    ["zero", 0, "— 0 —"],
    ["large", 1024, "— 1024 —"],
  ])("renders the %s between dashes", (_name, num, expected) => {
    const { container } = render(<PageNumber num={num} />);
    expect(container.textContent).toBe(expected);
    expect(screen.getByText(expected).style.textAlign).toBe("center");
  });
});
