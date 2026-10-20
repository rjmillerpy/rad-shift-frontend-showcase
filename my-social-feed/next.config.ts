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

export default nextConfig;
