# rad-shift frontend

A social app where one stream of posts is shown through many "skins": the
classic feed (`/lame`), bubbles, a forum (agora), a mosaic, a spreadsheet
ledger, an LLM-narrated chronicle, media, and **Amble**, a Phaser town you walk
around in where signs, shopkeepers and passers-by read you posts. Plus widgets
(sandboxed user code), a blog, trends and settings. This is the Next.js
frontend; the FastAPI backend is
[rad-shift-showcase](https://github.com/rjmillerpy/rad-shift-showcase).

## This repository is the open-core mirror

rad-shift is developed in private repositories, which run production. This
public mirror is exported from them automatically on every push to `main`, from
an allowlist of paths, so what you see is the real code, CI and tests. It is
read-only; issues and pull requests are off. Its git history starts at the split
(older commits held the private code); [BUILD_LOG.md](BUILD_LOG.md) records how it got here.

Two things stay private: the **admin console** (`/admin`: moderation,
analytics, graphs, generator and Amble-binding editors), and **Amble's
production town**. Amble reads its town through one module,
[`src/app/amble/data/town.ts`](my-social-feed/src/app/amble/data/town.ts): this
repository ships a small demo town there (two streets, a two-floor café, a
pond), built with the same map helpers and checked by the same contract
([`_townAssertions.ts`](my-social-feed/__tests__/app/amble/data/_townAssertions.ts)),
so every engine path (collision, interiors and stairs, dialogue, roaming NPCs)
runs on it.

## Run it
With the backend repository cloned next to this one, `docker compose up --build --wait`
in the backend starts Postgres, the API on :5000 and this app on :3000. Or, from
`my-social-feed/`: `npm ci && npm run dev` against a backend at
`NEXT_PUBLIC_API_URL` (default `http://localhost:5000`).

## CI
Every push runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): **lint** (the pre-commit hooks: ESLint, `tsc --noEmit`, file hygiene) and **test** (Jest) in parallel, then **build** the Docker image once both pass.

**Tests: 4,117 Jest tests · coverage 90.4% lines / 83.0% branches** (88.5% statements, 85.1% functions). Every file under `src/` has a test file at the mirrored path (`__tests__/.../test_<name>.test.ts[x]`); files starting with `_` under `__tests__/` are shared helpers. CI fails if any of them drops below the floor in [`jest.config.ts`](my-social-feed/jest.config.ts) (`coverageThreshold`), and puts the table on each run's summary page. Locally, `npm test -- --coverage` writes a browsable report to `coverage/index.html`.

[`pre-commit`](.pre-commit-config.yaml) runs the same lint and type checks before every commit: `pip install pre-commit && pre-commit install` once per clone (after `npm ci`).

**Dependencies:** Dependabot (configured in the private repository; this mirror gets no dependency PRs) opens weekly PRs for npm, the Docker base image and GitHub Actions, grouping minor/patch updates; each PR runs CI + Integration. Node majors are held back for a deliberate LTS upgrade. Vulnerability alerts and security-fix PRs are on.

**Secrets:** Trufflehog scans staged files in the pre-commit hook (needs the [trufflehog binary](https://github.com/trufflesecurity/trufflehog/releases) on your PATH), each push in the CI `secrets` job, and the full history weekly via [`secret-scan.yml`](.github/workflows/secret-scan.yml). Any detection fails, verified or not.

Run the same checks locally (from `my-social-feed/`):
```bash
npm ci
npm run lint
npm run typecheck
npm test -- --ci --coverage
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 -t radshift-frontend .
```

**Health:** `GET /api/health` returns `{"status":"ok"}` from the running Next.js server (never cached, and independent of the backend, which has its own `/health`). The backend repo's `compose.yaml` uses it as this container's healthcheck.

**Integration:** [`.github/workflows/integration.yml`](.github/workflows/integration.yml) runs the end-to-end suite from the backend repo against this frontend + the backend's `main`: the full stack in Docker Compose, driven by a real browser. The suite and how to run it locally: [rad-shift-showcase/e2e/README.md](https://github.com/rjmillerpy/rad-shift-showcase/blob/main/e2e/README.md).
