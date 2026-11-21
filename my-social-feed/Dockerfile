# Frontend image: Next.js standalone server on port 3000.
#
#   docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 -t radshift-frontend .
#
# Three stages. Only the last one ships; the first two are thrown away, so
# dev dependencies and source code never reach the final image.

# ── 1. deps: install node_modules (cached until package*.json change) ──────
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. build: compile the app ──────────────────────────────────────────────
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at BUILD time, so
# this must be the backend URL as the *browser* sees it, not a Docker
# service name like http://backend:5000. Changing it means rebuilding.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── 3. runtime: just the standalone server + static assets ────────────────
# Distroless: node and its runtime libraries only. No shell, package manager,
# perl or util-linux, which is most of what an image scanner finds in
# node:24-slim (item 21: 247 matches, 7 critical, before). Node is at
# /nodejs/bin/node and isn't on PATH, so healthchecks name it in full.
# Pinned by digest; Dependabot proposes newer digests. Current: Node 24.22.2,
# first published 2026-10-31 (distroless digests report a 1970 build date;
# the oldest distroless commit tagged on a digest dates it).
FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:b8cec4b2f2126ff7bd034ec9ac207ffb3272667dfdc48376e3b035d3270549ba AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# `.next/standalone` contains server.js plus only the node_modules it uses;
# static assets and public/ must be copied alongside it.
COPY --from=build --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=build --chown=nonroot:nonroot /app/public ./public

# The :nonroot base already runs as uid 65532; stated here so it survives a
# change of base image.
USER nonroot
EXPOSE 3000
# The image's entrypoint is node itself.
CMD ["server.js"]
