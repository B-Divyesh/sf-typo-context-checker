# Independent verification 3 — FAIL

Date: 2026-08-30

Work order: `typo-context-checker-verify-3`

Candidate: `589ea84289efb79eb0fea92a06dc17f449c76e93` (`589ea84`)

Live URL: <https://typo-context-checker.sociobot.in/>

Scope: clean dependency install, every registered claim command, full release suite, packaged VS Code and Chromium consumers, live desktop and 390px browser QA, privacy/network inspection, accessibility, headers, caching, bundle budgets, and local/live artifact comparison. No product code was modified.

## Result

**FAIL.** The deployed product is usable, fast, private in the observed flows, and byte-identical to the candidate build. The repaired cross-file VS Code workflow also works. Acceptance is nevertheless blocked because one mandatory claim command failed from the clean worker, and the product makes runtime promises that are absent from `.factory/claims.json`. Independent probing also found that the VS Code extension ignores trusted vocabulary in the file currently being edited.

## Mandatory claims gate

This was the first QA operation after `npm ci` from the clean candidate checkout. `.factory/claims.json` exists with 11 entries. Ten exact commands passed. The VS Code claim command failed before any host packages were added:

```text
npm run test:vscode
/work/repo/.vscode-test/vscode-linux-x64-1.135.0/code:
error while loading shared libraries: libgtk-3.so.0: cannot open shared object file
Exit code: 127
```

The supplied contract says any failing listed claim command is release-blocking. `README.md` mentions unspecified “Linux GUI libraries” but neither the repository nor the exact command installs or checks them. After installing `libgtk-3-0t64` in the worker, the same command passed and proved the repaired product behavior. That later result is useful product evidence but does not erase the clean-run gate failure.

| Claim | Exact command | Clean-run result |
| --- | --- | --- |
| `workspace-context` | `npm test -- -t @claim:workspace-context` | PASS — 1 test |
| `sensitive-defaults` | `npm test -- -t @claim:sensitive-defaults` | PASS — 1 test |
| `demo-local-match` | `npm run test:e2e -- --grep @claim:demo-local-match` | PASS — 2 projects |
| `site-local-only` | `npm run test:e2e -- --grep @claim:site-local-only` | PASS — 2 projects |
| `extension-local-only` | `npm test -- -t @claim:extension-local-only` | PASS — 1 test |
| `vscode-quick-fix-undo-dismiss` | `npm run test:vscode` | **FAIL — exit 127, missing GTK 3** |
| `github-diff-checking` | `npm run test:extension` | PASS |
| `workspace-file-limit` | `npm test -- -t @claim:workspace-file-limit` | PASS — 1 test |
| `vscode-version` | `npm test -- -t @claim:vscode-version` | PASS — 1 test |
| `no-paid-gate` | `npm test -- -t @claim:no-paid-gate` | PASS — 1 test |
| `demo-ephemeral` | `npm run test:e2e -- --grep @claim:demo-ephemeral` | PASS — 2 projects |

The registry is also incomplete. The Chromium popup displays the behavioral promise **“Offline · still works”**, but no `offline` claim or tagged offline extension test exists. Visitor-facing statements that the extension “does not alter GitHub, modify source, [or] block merges” and “does not make a change without your Quick Fix choice” likewise have no claim entries that assert those outcomes. Under the supplied claims contract, unlisted claims fail review even when they are plausible.

## Cold first-read and demo gate

The automatic first-read gate passes at both 1440×900 and 390×844:

- What it does: “Find near-match code typos before review.”
- For whom: “For software engineers and reviewers…”
- First action: “Try it with sample data,” fully visible in both initial viewports.
- One keyboard-activated click opens `/demo/`, where two explained findings are already present.
- The persistent banner says “Demo — sample data, nothing is saved” and includes Reset demo and Start for real.

The 390px positions were measured: the audience sentence ends at 653px and the sample action spans 681–729px in an 844px viewport. Evidence: `verification-evidence/verify-3/live-cold-desktop.png`, `live-cold-mobile.png`, and `live-audit.json`.

The first-screen fact line does not fully satisfy the attached plain-words contract. It says “No account · VS Code 1.85+ · repository stays on your device,” but the required price and offline facts are absent. The brief says the product is free, while the extension itself claims offline operation elsewhere.

## Install, tests, build, and packages

- `npm ci`: PASS — 296 packages installed, 297 audited, 0 vulnerabilities.
- `npm run check`: PASS — TypeScript and 15/15 Vitest tests.
- `npm run build`: PASS — Chromium MV3, ZIP, VS Code compilation, VSIX, static site, and deploy verification; `dist/` produced.
- `npm run test:e2e`: PASS — 22/22 desktop and 390px Playwright tests.
- `npm run test:extension`: PASS — unpacked MV3 popup replacement/Undo/dismiss, axe, and intercepted GitHub pull/commit/compare flows.
- `npm run test:vscode`: PASS only after installing GTK 3 — packaged host reports `databse_url → database_url`, Quick Fix, native Undo, and exact-pair dismissal.
- `npm run qa`: PASS after installing GTK 3.
- The live VSIX installed into a fresh VS Code extensions directory and listed as `sociobot.context-check@1.1.0`.
- Fresh local and live Chromium ZIP/VSIX archives have different container hashes because rebuild timestamps differ, but recursive extraction comparisons produced no file differences (12 Chromium files and 8 VS Code files).

## Core workflow probe

The prior cross-file recommendation bug is repaired, but the repair excludes the complete active document from vocabulary. `vscode/extension.ts` passes the active path in `excludedPaths`, and `repositoryVocabulary()` removes that document entirely.

Using the compiled production matcher with one permitted document containing a trusted `database_url` and checking a new `databse_url` in that same document produced:

```json
{
  "activeDocumentExcluded": [],
  "activeDocumentIncluded": [
    { "introduced": "databse_url", "existing": "database_url", "distance": 1 }
  ]
}
```

This misses a common real repository case and narrows the unqualified claims that permitted local repository files supply vocabulary. The current packaged VS Code test only covers the trusted token in a different file.

## Live end-to-end evidence

A fresh 390px browser context exercised the complete demo with request and error recording:

- Bundled sample: 2 explained findings.
- Config key: `databse_url → database_url`, one finding with a length explanation.
- Filename/command: `./deply-production.sh → deploy-production.sh`, one finding.
- Exact match and short three-character boundary: no finding.
- Empty required side: a plain corrective message appears; filling both sides recovers normally.
- Punctuation/emoji invalid input: no crash; the empty result is explained.
- `Ctrl+Enter`, button activation, keyboard navigation into the demo, Reset demo, and Start for real are present/operable.
- Demo storage after the flow: 0 cookies, 0 localStorage entries, 0 sessionStorage entries.
- No service worker registration exists; the site is not a PWA and makes no site-offline claim.
- All 10 recorded requests in the landing-to-demo flow were same-origin. No analytics, model, CDN-font, or third-party request occurred.
- No page or console errors occurred in the tested product routes.

The site exposes no application API, product-unlock call, account, or sign-in. Rate-limit and Entra checks are therefore not applicable. No backend persistence boundary exists.

## Accessibility, responsive behavior, and visual review

- `/`, `/demo/`, `/privacy/`, `/terms/`, and the real 404 were tested at 1440px and 390px.
- Axe found zero serious/critical violations on all 10 route/viewport combinations.
- The demo has one **moderate** Axe `heading-order` violation: its results use `<h3>` immediately after the page `<h1>`, with no `<h2>`.
- Every route has `lang=en`, one `<h1>`, one `<main>`, complete image alt text, no horizontal overflow at 390px, and no visible control below 44×44px.
- First Tab focuses and reveals the skip link. Its measured focus indicator is a 3px proof-red outline; keyboard traversal reaches the sample action, which opens the demo with Enter.
- Reduced motion limits finding animation/transition duration to 0.01ms. No flashing or looping motion exists.
- The design matches `.factory/design.md`: distinctive newsprint/editorial composition, high-contrast ink/proof palette, original proofreader image, and clear mobile stacking.
- `/opt/fleet/lib/verify-url.sh` passed the live root with no errors, title, `lang`, one h1, main landmark, alt text, and labeled controls.

The standard route skeleton is incomplete on legal/404 pages: their headers omit the common wordmark navigation, and the 404 omits the required description, canonical, Open Graph, Twitter card, and apple-touch metadata.

## Headers, identity, caching, and budgets

The live root returns CSP, `Referrer-Policy: no-referrer`, Permissions Policy, HSTS, and `X-Content-Type-Options: nosniff`. The CSP carries `frame-ancestors 'none'` as a response header. Hashed assets return `Cache-Control: public, max-age=31536000, immutable`; downloads return `public, max-age=3600`; HTML returns a 30-second revalidation policy. An unknown route returns the designed page with HTTP 404.

Freshly built candidate files and live files matched byte-for-byte for every tested HTML page, the 404, robots, sitemap, JS, CSS, hero image, and social image. Key SHA-256 values:

- Root HTML local/live: `47f28903273ff9e51f6e86f50a3035884dd391136bcd4dc670f31929a52ffc71`.
- Main JS local/live: `1772839c057d6a8861d79fb16f8c1b7602fd4ddb457933cefc4a0965c6008fab`.
- Main CSS local/live: `0cd68e1076cdc93b8c132e55a35a65754e20f3f20c03b4a66de21fb243ab051f`.
- Mobile hero AVIF local/live: `a20489e746d9ef5e861e87245af19daa9b3c808ab09a1b1689171d28eae368d1`.

Budgets pass: initial JS 5,281 bytes (2.51 KB gzip), CSS 10,220 bytes (2.99 KB gzip), no web fonts, 38,600-byte mobile hero AVIF, and 50.70 KB MV3 output. Fresh Lighthouse 12.8.2 mobile scores are Performance 100, Accessibility 100, Best Practices 100, and SEO 100; FCP 1.1s, LCP 1.1s, CLS 0, TBT 70ms, Speed Index 1.1s, and 47 KiB transfer.

## Defects

### Blocker — a registered claim command fails from the clean worker

`npm run test:vscode` exits 127 because its downloaded VS Code runtime requires GTK 3, which is neither present in the supplied clean environment nor provisioned by the repository. The claims contract explicitly makes any such failure release-blocking. Add a deterministic prerequisite/bootstrap step usable by the exact registered command, or change the test harness to a supported self-contained route.

### Blocker — runtime promises are missing from the claims registry

The Chromium popup states “Offline · still works,” but `.factory/claims.json` has no offline claim/test. The no-GitHub-mutation/no-merge-blocking promises are also unlisted. Register one observable sandbox test per promise or remove/narrow the copy.

### Major — active-file vocabulary is ignored

The VS Code extension excludes the entire active document while checking an edit. A correct established token and its new typo in the same permitted file produce no diagnostic. Preserve established tokens from the active document while excluding only the edited token/prior partial token, and add packaged-host coverage for the same-file case and both file orders.

### Major — first-screen facts omit price and offline behavior

The mandatory three facts provide account, compatibility, and local-device information, but do not plainly state that the product is free or that the extension works offline. Add accurate, registered, tested facts without implying that the static website itself reloads offline.

### Minor — demo heading order skips a level

`/demo/` renders an `<h1>` followed by the result `<h3>`, producing Axe `heading-order` with moderate impact. Use an `<h2>` for the result heading or introduce the missing section heading.

### Minor — legal/404 route skeleton and 404 metadata are incomplete

Privacy, terms, and 404 do not use the common wordmark/navigation header. The 404 also lacks description, canonical, Open Graph, Twitter card, and apple-touch metadata required by the supplied site-structure contract.

## Evidence

- `.factory/verification-evidence/verify-3/verify.json`
- `.factory/verification-evidence/verify-3/live-audit.json`
- `.factory/verification-evidence/verify-3/same-file-probe.json`
- `.factory/verification-evidence/verify-3/lighthouse.json`
- `.factory/verification-evidence/verify-3/live-cold-desktop.png`
- `.factory/verification-evidence/verify-3/live-cold-mobile.png`
- `.factory/verification-evidence/verify-3/live-mobile-demo.png`
- `.factory/verification-evidence/verify-3/screenshot-desktop.png`
- `.factory/verification-evidence/verify-3/screenshot-mobile.png`

## Required next steps

1. Make every exact claim command pass from the supplied clean worker without undocumented host preparation.
2. Register and test every runtime/visitor promise, especially offline extension behavior and non-mutation.
3. Retain safe same-file vocabulary while excluding the active partial token, then add an integration regression.
4. Complete the first-screen facts and repair the demo heading outline and route skeleton metadata.
