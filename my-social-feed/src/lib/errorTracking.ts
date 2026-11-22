/**
 * Sentry settings shared by the Node server, the edge runtime and the
 * browser (roadmap item 25; the backend's side is app/error_tracking/).
 *
 * Off unless NEXT_PUBLIC_SENTRY_DSN was set when the image was built
 * (Publish passes it from the repository variable), so tests, CI and local
 * builds send nothing. NEXT_PUBLIC_* values are inlined at build time, which
 * is why each one is spelled out in full below.
 */

export const DEFAULT_SENTRY_ENVIRONMENT = "local";

export interface ErrorTrackingOptions {
  dsn: string | undefined;
  enabled: boolean;
  environment: string;
  release: string | undefined;
  // Errors only: performance traces count against a separate quota.
  tracesSampleRate: number;
  // No IP addresses, cookies or request bodies on events.
  sendDefaultPii: false;
}

export function errorTrackingOptions(): ErrorTrackingOptions {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;
  return {
    dsn,
    enabled: dsn !== undefined,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || DEFAULT_SENTRY_ENVIRONMENT,
    // The commit the image was built from, so an issue names its deploy.
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  };
}
