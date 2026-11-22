"use client";

/**
 * Last-resort error page for a render error in the root layout itself
 * (every other page error is caught closer to where it happened). Reports
 * the error to Sentry, then offers a reload; it replaces the root layout,
 * so it brings its own <html> and <body>.
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main role="alert">
          <h1>Something went wrong</h1>
          <p>The error has been reported.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
