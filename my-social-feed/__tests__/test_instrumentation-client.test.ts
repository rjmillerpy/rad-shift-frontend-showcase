/** Tests for src/instrumentation-client.ts. @sentry/nextjs is the external boundary. */
import * as Sentry from "@sentry/nextjs";
import { errorTrackingOptions } from "@/lib/errorTracking";

jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  captureRouterTransitionStart: jest.fn(),
}));

describe("instrumentation-client", () => {
  it("starts Sentry in the browser with the shared settings on import", async () => {
    const client = await import("@/instrumentation-client");
    expect(Sentry.init).toHaveBeenCalledWith(errorTrackingOptions());
    expect(client.onRouterTransitionStart).toBe(Sentry.captureRouterTransitionStart);
  });
});
