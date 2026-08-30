# Context Check repair handoff

Date: 2026-08-30

Work order: `typo-context-checker-repair-2`

Verifier report: `8e837f13d62973d0738b0d76ff71397572445f55`

Failed candidate: `9b04971930155bd4a96e90167276fe9d330b3fdb`

Deploy root: `dist/site/`

## Release result

All documented release blockers and major findings are repaired. The original WXT MV3 artifact remains as a Chromium companion, and the brief’s required local VS Code extension now ships in the same build as `context-check-vscode.vsix`.

## Repairs

- Core scope: the VS Code extension indexes permitted local workspace files, checks complete affected lines as a person types, publishes explainable inline diagnostics, and offers native Quick Fix actions. The complete-line behavior fixes the partial repair’s inability to detect ordinary one-character editor events.
- Repository privacy: `.env*` files at any depth, secret directories, and root or nested PEM files are excluded. The VS Code extension has no network runtime. The Chromium companion retains only GitHub host access.
- Reversible action: Chromium “Use existing” changes the first introduced occurrence only, renders a live Undo action, and restores the exact original text. Exact-pair dismiss still has Undo.
- Touch targets: the wordmark, sample action, footer links, and legal navigation measure at least 44px high at 390px. The previous strict-selector regression was reproduced first, then corrected with exact accessible-name targeting.
- Response policy: Azure Static Web Apps configuration now sends CSP, `Referrer-Policy: no-referrer`, Permissions Policy, and `nosniff`. `/assets/*` uses `public, max-age=31536000, immutable`; this trailing-wildcard form is the form honored by Azure’s route matcher. A product-specific 404 is wired through `responseOverrides`.
- Demo and claims: `/demo/` opens sample repository data in one click, saves nothing, and supports reset/exit. Every product claim is registered in `.factory/claims.json` with exactly one tagged regression test.
- Site completion: route-specific titles/canonicals/social metadata, a 1200×630 product image, apple-touch icon, sitemap entry, consistent build identity, copy audit, and responsive demo/404 screens were added without changing the proofreader-broadsheet visual thesis.

## Exact verification evidence

Fresh install and full suite on the current worker image:

```text
npm ci                       PASS — 296 packages installed, 297 audited, 0 vulnerabilities
timeout 124s npm run qa      PASS — exit 0 in 48 seconds
npm run check                PASS — TypeScript + 10/10 Vitest tests
npm run build                PASS — MV3, VS Code VSIX, static site, deploy verification
npm run test:e2e             PASS — 16/16 Chromium tests across desktop and 390×844
npm run test:extension       PASS — unpacked MV3 popup/content integration + axe
npm run test:vscode          PASS — official VS Code 1.135 extension-host integration
```

The VS Code integration opens the packaged extension content in a fixture workspace, types the final character of `databse_url`, observes `database_url`, applies Quick Fix, runs native Undo, and dismisses the exact pair. The generated VSIX was also installed through the official VS Code CLI as `sociobot.context-check-1.1.0`.

The Chromium integration loads `dist/chrome-mv3` unpacked, verifies first-occurrence replacement and lossless Undo, dismiss/Undo, zero serious or critical axe findings, no console errors, and a real content-script note on an intercepted GitHub pull-request fixture.

Every command in `.factory/claims.json` passed independently. The privacy tests record browser requests during a complete sample check and statically inspect every extension runtime entry point for upload, telemetry, WebSocket, beacon, or model calls.

Accessibility and browser coverage includes one h1/main/lang/title, landmarks, alt text, labels, announced results, first-Tab skip links, Ctrl+Enter, 44px mobile targets, no 390px overflow, reduced-motion duration, desktop/mobile axe, and console/page-error capture. `/opt/fleet/lib/verify-url.sh` reported zero errors and all semantic checks passed.

Local Azure Static Web Apps emulation returned:

```text
HTML:   Referrer-Policy: no-referrer
        Permissions-Policy: camera=(), microphone=(), geolocation=()
        Content-Security-Policy: default-src 'self'; ... frame-ancestors 'none'
Asset:  Cache-Control: public, max-age=31536000, immutable
404:    HTTP 404 with “That page is not here.”
```

Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9s, LCP 0.9s, CLS 0, TBT 0ms, Speed Index 0.9s.

Budgets: initial JavaScript 5,281 bytes; main CSS 9,910 bytes; legal CSS 1,610 bytes; MV3 unpacked output 50.70KB; mobile hero AVIF 38,600 bytes. No CDN font, third-party script, analytics SDK, account, or runtime model call is present.

## Deploy and live identity

Deployment target is the existing static resource `sf-typo-context-checker`. No unrelated service, database, vault, app setting, DNS resource, or secret is read or changed. Live response and byte-identity evidence is recorded after deployment below.

## Known gaps

- The Chromium companion intentionally sees visible GitHub diff context; the VS Code extension is the complete local-workspace product from the brief.
- The VSIX is a directly installable, unsigned package. Marketplace submission remains a release-management step and does not change the tested artifact.
- Official VS Code host testing on this Linux worker needs GTK 3 and Xvfb; the worker image lacked GTK 3 before it was installed for the integration run.
