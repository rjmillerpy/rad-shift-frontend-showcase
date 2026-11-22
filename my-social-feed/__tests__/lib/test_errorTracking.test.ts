/** Tests for src/lib/errorTracking.ts: Sentry settings from build-time env. */

const SENTRY_VARS = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_SENTRY_RELEASE",
] as const;

describe("errorTrackingOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    for (const name of SENTRY_VARS) delete process.env[name];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function options() {
    // Fresh module each time: the real one reads env when called, but this
    // keeps the test honest if that ever moves to import time.
    jest.resetModules();
    return require("@/lib/errorTracking");
  }

  it("is off without a DSN, so tests and local builds send nothing", () => {
    const { errorTrackingOptions } = options();
    expect(errorTrackingOptions()).toMatchObject({ dsn: undefined, enabled: false });
  });

  it("treats an empty DSN as unset", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "";
    expect(options().errorTrackingOptions().enabled).toBe(false);
  });

  it("is on with a DSN, tagged with the environment and release", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.invalid/1";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "production";
    process.env.NEXT_PUBLIC_SENTRY_RELEASE = "abc1234";
    expect(options().errorTrackingOptions()).toMatchObject({
      dsn: "https://public@example.invalid/1",
      enabled: true,
      environment: "production",
      release: "abc1234",
    });
  });

  it("defaults the environment to local", () => {
    const { errorTrackingOptions, DEFAULT_SENTRY_ENVIRONMENT } = options();
    expect(errorTrackingOptions().environment).toBe(DEFAULT_SENTRY_ENVIRONMENT);
    expect(DEFAULT_SENTRY_ENVIRONMENT).toBe("local");
  });

  it("sends errors only, and no personal data", () => {
    expect(options().errorTrackingOptions()).toMatchObject({
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
  });
});
