/**
 * Browser startup hook: error tracking for client components and event
 * handlers (src/lib/errorTracking.ts has the settings).
 */
import * as Sentry from "@sentry/nextjs";
import { errorTrackingOptions } from "@/lib/errorTracking";

Sentry.init(errorTrackingOptions());

// Ties errors to the client-side navigation they happened during.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
