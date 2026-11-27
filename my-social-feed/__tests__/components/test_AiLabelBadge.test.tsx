import { render, screen } from "@testing-library/react";
import AiLabelBadge from "@/components/AiLabelBadge";

describe("AiLabelBadge", () => {
  it.each([
    ["author", "The author says"],
    ["content_credentials", "image says in its own data"],
    ["moderator", "A moderator labelled"],
  ] as const)("labels a %s-labelled post and says why", (label, why) => {
    render(<AiLabelBadge label={label} />);
    expect(screen.getByText(/AI-generated/)).toHaveTextContent(why);
  });

  it.each([null, undefined])("shows nothing for %s", (label) => {
    const { container } = render(<AiLabelBadge label={label} />);
    expect(container).toBeEmptyDOMElement();
  });
});
