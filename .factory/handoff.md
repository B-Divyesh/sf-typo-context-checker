# Context Check repair handoff

Date: 2026-08-30

Work order: `typo-context-checker-repair-3`

Base verified candidate: `3d5a98edd32634755e31ca30fe549e553f1c6f12`

Live URL: <https://typo-context-checker.sociobot.in/>

## Repair result

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

## Run and deploy

```sh
npm ci
npm run qa
```

The deployment artifact is `dist/site/`. Live deployment, response-policy, identity, and Lighthouse evidence will be appended after the static upload for this repair commit.

## Known gaps

None in the repaired product scope. The Linux VS Code host emits environment-level DBus/provider diagnostics under Xvfb, but the extension test itself exits successfully with no Context Check errors.
