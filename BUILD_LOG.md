# Build log

This mirror starts at the open-core split, so its git history is short. This
log records how the frontend got here, from the private repository's history.
Dates are commits to `main`.

## 2025: the app
- **2025-03 to 2025-12**: Next.js social feed: posts, likes, reposts, quotes, drafts, auth.

## 2026: features
- **2026-03-28**: The bubbles feed, laugh reactions, settings pages, a PostCard refactor, the first test suite (581 tests).
- **2026-09-23**: The skins (bubbles, chronicle, agora, mosaic, ledger, media, and Amble, the Phaser town), widgets, blog, trends, settings and the admin console; per-route tests. Blog HTML sanitized at render time.

## 2026-09 to 2026-10: the DevOps roadmap
- **09-24**: The production build passes; a Docker image.
- **09-30**: GitHub Actions CI (lint, test, build) and the cross-repo end-to-end suite.
- **10-01**: Type-checking and pre-commit in CI; TruffleHog on commit, push and weekly; Dependabot; Next.js security upgrade and the remaining advisories cleared.
- **10-02**: Node 24 LTS; Jest coverage with a floor and a CI summary.
- **10-05**: `/api/health` for container healthchecks; a code-quality pass against [CODE_QUALITY_RULES.md](CODE_QUALITY_RULES.md): no component over 300 lines, no explicit `any`, a mirrored test file for every source file.
- **10-18**: Continuous delivery: the image published to ECR on a green `main`.
- **10-19**: SonarQube Cloud with a quality gate, then its security, reliability and accessibility findings cleared (a shared accessible Modal, keyboard-dismissable dialogs).
- **10-20**: A jscpd duplicate-code ratchet and deduplication from 4.7% to 1.3% (fixing four bugs it surfaced); a distroless runtime image, Semgrep and npm audit; an on-demand AI code reviewer.
- **10-20**: The open-core split: Amble's town behind one module (`src/app/amble/data/town.ts`) with a public demo town, and this mirror exported from an allowlist with leak and secret checks.
