/** Tests for src/instrumentation.ts. @sentry/nextjs is the external boundary. */
import * as Sentry from "@sentry/nextjs";
import { onRequestError, register } from "@/instrumentation";
import { errorTrackingOptions } from "@/lib/errorTracking";

jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  captureRequestError: jest.fn(),
}));

describe("instrumentation", () => {
  it("starts Sentry with the shared settings and no local variables", () => {
    register();
    expect(Sentry.init).toHaveBeenCalledWith({
      ...errorTrackingOptions(),
      includeLocalVariables: false,
    });
  });

  it("reports server request errors through Sentry", () => {
    expect(onRequestError).toBe(Sentry.captureRequestError);
  });
});
