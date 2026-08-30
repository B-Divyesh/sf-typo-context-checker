# Context Check verification handoff

Date: 2026-08-30

Work order: `typo-context-checker-verify-3`

Candidate: `589ea84289efb79eb0fea92a06dc17f449c76e93`

Live URL: <https://typo-context-checker.sociobot.in/>

## Verification result

**FAIL — do not release this candidate.**

The deployed product matches the candidate, passes the cold first-read/demo gate, and works across the tested website, Chromium, and cross-file VS Code flows. Acceptance remains blocked by the mandatory claims gate: `npm run test:vscode` fails from the clean worker with missing `libgtk-3.so.0` (exit 127). It passes only after installing `libgtk-3-0t64`, which the exact claim command does not provision.

The claims registry is also incomplete: the Chromium popup promises “Offline · still works,” with no corresponding claim/test, and visitor-facing non-mutation/no-merge-blocking promises are likewise unlisted. Independent production-matcher probing found that the extension excludes the whole active document, so `database_url` followed by a new `databse_url` in the same permitted file produces no diagnostic.

Full evidence and severity-ranked defects are in [verification-3.md](verification-3.md).

## Verification summary

- `npm ci`: PASS — 296 packages, 0 vulnerabilities.
- Registered claims from clean state: **10 PASS, 1 FAIL** (`vscode-quick-fix-undo-dismiss`, missing GTK 3 runtime).
- `npm run check`: PASS — TypeScript + 15 Vitest tests.
- `npm run build`: PASS — complete `dist/` output and deploy verifier.
- `npm run test:e2e`: PASS — 22/22.
- `npm run test:extension`: PASS.
- `npm run test:vscode`: PASS after installing GTK 3.
- `npm run qa`: PASS after installing GTK 3.
- Live root/demo/privacy/terms: 200; designed unknown route: 404.
- Live desktop/390px: zero axe serious/critical findings, no overflow, no undersized controls, no product console errors.
- Live demo: sample, normal, boundary, invalid, keyboard, error recovery, reset, and ephemeral-storage flows pass.
- Privacy: all observed flow requests same-origin; no cookies or web storage; policy headers present.
- Candidate/live identity: tested HTML/CSS/JS/images match byte-for-byte; live package extractions match local package contents.
- Lighthouse mobile: 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO; LCP 1.1s, CLS 0, TBT 70ms, 47 KiB transfer.
- Static site has no API, unlock route, account, sign-in, or service worker; rate-limit, Entra, backend persistence, and PWA update checks are not applicable.

## Defects

- **Blocker:** exact registered VS Code claim command fails from the clean worker (missing GTK 3).
- **Blocker:** runtime promises are absent from `.factory/claims.json`, notably “Offline · still works.”
- **Major:** active-document vocabulary is wholly excluded, missing same-file near matches.
- **Major:** first-screen facts omit explicit free-price and offline-extension facts required by the acceptance contract.
- **Minor:** `/demo/` skips from h1 to h3; Axe reports moderate `heading-order`.
- **Minor:** legal/404 headers do not follow the common route skeleton; 404 social/canonical metadata is incomplete.

## Evidence

Evidence is under `.factory/verification-evidence/verify-3/`. The full report records commands, hashes, headers, request log, browser cases, accessibility results, and performance metrics.

## Next steps

Provision the VS Code test prerequisite through the exact registered command, complete the claims registry, preserve safe same-file vocabulary, and repair the remaining first-screen/accessibility/route-contract gaps. Re-run every claim command from a fresh worker before requesting verification again.
