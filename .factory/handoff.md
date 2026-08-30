# Context Check repair handoff

Date: 2026-08-30

Work order: `typo-context-checker-repair-3`

Base verified candidate: `3d5a98edd32634755e31ca30fe549e553f1c6f12`

Live URL: <https://typo-context-checker.sociobot.in/>

## Repair result

**PASS — repaired artifact deployed.**

The release-blocking VS Code workflow is repaired. Context Check now removes the active document from candidate repository vocabulary while evaluating an edit, so a saved partial token can never outrank an established token in another permitted file. The new regression exercises both workspace file orders and the packaged VS Code host confirms `databse_url → database_url`, native Quick Fix Undo, and exact-pair dismissal.

The landing first screen now names software engineers and reviewers explicitly. Direct, plain labels replace the flagged metaphor copy. Every visible interactive control on root, demo, legal, and 404 routes is audited at 390px for a 44×44px minimum. The claims registry now covers the reported Quick Fix, Chromium GitHub route, 300-file default, compatibility, account/payment, and demo-storage promises with one exact tagged test each.

## What changed

- Excluded the active VS Code document’s saved/current text from comparison candidates only; the rest of the permitted workspace remains repository vocabulary.
- Added deterministic active-document order regression coverage plus a retry around the VS Code host’s transient cancelled code-action provider response.
- Expanded packaged Chromium coverage from a pull request fixture to pull request, commit, and compare fixtures.
- Added the audience sentence, made the sample action primary, removed prohibited mood labels, and updated the copy audit.
- Added a comprehensive 390px target audit for every visible link, button, field, and summary control on every shipped route.
- Added demo persistence, no-service-worker/update, direct-copy, account/payment, file-limit, and VS Code engine regressions.

## Local verification

Clean install:

```text
npm ci                         PASS — 296 packages, 0 vulnerabilities
```

Release suite:

```text
npm run qa                     PASS
  npm run check                PASS — TypeScript + 15 Vitest tests
  npm run build                PASS — MV3 ZIP, VSIX, static site, deploy verification
  npm run test:e2e             PASS — 22 desktop/390px Playwright tests
  npm run test:extension       PASS — popup Undo/dismiss, axe, pull/commit/compare fixtures
  npm run test:vscode          PASS — packaged VSIX host workflow, Quick Fix, Undo, dismiss
```

All 11 entries in `.factory/claims.json` were also invoked individually and passed. The local URL verifier passed for the built root with title, `lang=en`, one `<h1>`, `<main>`, complete image alt text, labeled buttons, and no page or console errors. Playwright’s Axe integration reports zero serious or critical violations on root, demo, privacy, terms, and 404 at desktop and 390px. The standalone Axe CLI could not start its bundled ChromeDriver against the preinstalled Playwright Chromium; the direct Playwright Axe integration is the authoritative passing accessibility run.

The static artifact intentionally registers no service worker and makes no offline/update claim; the browser suite asserts that no registration exists. The demo is separately tested from a fresh browser context and leaves no cookies, localStorage, or sessionStorage entries. The static deploy verifier confirms CSP, referrer, permissions, immutable asset-cache, and 404 configuration. Initial JavaScript is 5,281 bytes (2.51 KB gzip); main CSS is 10.22 KB (2.99 KB gzip); the MV3 output is 50.70 KB.

## Live deployment verification

Commit `fee3d8d` was pushed to `main` and `dist/site/` was uploaded to the existing `sf-typo-context-checker` Static Web App. The deployment completed successfully at its Azure Static Web Apps hostname and the product URL serves the repair.

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200. An unknown route returns the product 404 with status 404.
- `/opt/fleet/lib/verify-url.sh` passed against the live root: 636 ms load, no page or console errors, title, `lang=en`, one `<h1>`, one `<main>`, complete image alt text, and labeled buttons. Screenshots and JSON are in `verification-evidence/repair-3/`.
- Fresh Playwright desktop and 390px contexts passed axe with zero serious/critical violations on root, demo, privacy, terms, and 404; first Tab reached the skip link, the demo showed two findings, and no route overflowed.
- The complete live demo flow made no cross-origin request, left no cookie/localStorage/sessionStorage state, and registered no service worker.
- Root policy headers are live: CSP, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, HSTS, and `X-Content-Type-Options: nosniff`. The hashed JS asset returns `Cache-Control: public, max-age=31536000, immutable`; the VSIX download returns `public, max-age=3600`.
- Local/live SHA-256 values match for root HTML (`47f28903273ff9e51f6e86f50a3035884dd391136bcd4dc670f31929a52ffc71`), main JS (`1772839c057d6a8861d79fb16f8c1b7602fd4ddb457933cefc4a0965c6008fab`), main CSS (`0cd68e1076cdc93b8c132e55a35a65754e20f3f20c03b4a66de21fb243ab051f`), and the 960px hero AVIF (`a20489e746d9ef5e861e87245af19daa9b3c808ab09a1b1689171d28eae368d1`).
- Lighthouse 12.8.2 mobile result: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 0.9 s, CLS 0, TBT 0 ms, Speed Index 0.9 s, and 47 KiB transfer.

## Run and deploy

```sh
npm ci
npm run qa
```

The deployment artifact is `dist/site/`. Deploy it only to the existing `sf-typo-context-checker` Static Web App.

## Known gaps

None in the repaired product scope. The Linux VS Code host emits environment-level DBus/provider diagnostics under Xvfb, but the extension test itself exits successfully with no Context Check errors.
