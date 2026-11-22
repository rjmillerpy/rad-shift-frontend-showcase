/**
 * Next.js server startup hook: error tracking for server rendering, route
 * handlers and middleware (src/lib/errorTracking.ts has the settings).
 */
import * as Sentry from "@sentry/nextjs";
import { errorTrackingOptions } from "@/lib/errorTracking";

export function register(): void {
  // One init for both server runtimes (nodejs and edge). Local variables
  // stay off on the server: they'd carry request headers (tokens, cookies).
  Sentry.init({ ...errorTrackingOptions(), includeLocalVariables: false });
}

// Errors thrown while rendering a server component or in a route handler.
export const onRequestError = Sentry.captureRequestError;
