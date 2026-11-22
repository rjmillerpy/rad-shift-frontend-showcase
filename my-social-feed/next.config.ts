import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server in .next/standalone (only the node_modules
  // it actually uses), so the Docker runtime image stays small.
  output: "standalone",
  // The app renders plain <img> (no next/image), so Next's image optimizer
  // (/_next/image, which runs sharp on remote images) is pure attack surface.
  images: {
    unoptimized: true,
  },
};

// Item 25: upload source maps to Sentry so browser stack traces read as the
// original TypeScript, then delete them from the build so they're never
// served. Only with SENTRY_AUTH_TOKEN (an organization token, which also
// names the org; Publish passes it as a build secret); without one, maps
// aren't generated or uploaded at all.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || undefined;

export default withSentryConfig(nextConfig, {
  project: "rad-shift-frontend",
  authToken: sentryAuthToken,
  // The same release the runtime reports (src/lib/errorTracking.ts), so
  // Sentry matches each event to this build's maps.
  release: { name: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined },
  sourcemaps: {
    disable: sentryAuthToken === undefined,
    deleteSourcemapsAfterUpload: true,
  },
  // No build telemetry sent to Sentry; quiet unless uploading.
  telemetry: false,
  silent: sentryAuthToken === undefined,
});
