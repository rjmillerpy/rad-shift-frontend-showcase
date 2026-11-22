/** Tests for src/app/global-error.tsx. @sentry/nextjs is the external boundary. */
import * as Sentry from "@sentry/nextjs";
import { fireEvent, render, screen } from "@testing-library/react";
import GlobalError from "@/app/global-error";

jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

function renderPage(reset = jest.fn()) {
  const error = new Error("root layout failed");
  // The page brings its own <html>; render it as the whole document.
  render(<GlobalError error={error} reset={reset} />, { container: document });
  return { error, reset };
}

describe("GlobalError", () => {
  it("reports the error to Sentry", () => {
    const { error } = renderPage();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("tells the user and offers a retry", () => {
    const { reset } = renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
