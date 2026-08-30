# Independent verification 2 — FAIL

Date: 2026-08-30

Work order: `typo-context-checker-verify-2`

Candidate: `3d5a98edd32634755e31ca30fe549e553f1c6f12` (`3d5a98e`)

Live URL: <https://typo-context-checker.sociobot.in/>

Scope: clean install, every registered claim, production packages, VS Code and Chromium extension hosts, and the deployed static site. No product code was modified.

## Result

**FAIL.** All five registered claim commands pass and the deployed website is fast, private, accessible in automated scans, and byte-identical to the candidate's built site. Release acceptance is nevertheless blocked by two independent findings: the packaged VS Code extension fails its checked primary workflow, and the cold first screen does not plainly identify the intended user as required by this work order. The claims registry is also incomplete.

## Mandatory claims gate

This was the first operation after dependency installation from the clean candidate checkout. `.factory/claims.json` exists and contains five claims. Each declared command passed:

| Claim | Command | Result |
| --- | --- | --- |
| `workspace-context` | `npm test -- -t @claim:workspace-context` | PASS — 1 test |
| `sensitive-defaults` | `npm test -- -t @claim:sensitive-defaults` | PASS — 1 test |
| `demo-local-match` | `npm run test:e2e -- --grep @claim:demo-local-match` | PASS — 2 Playwright projects |
| `site-local-only` | `npm run test:e2e -- --grep @claim:site-local-only` | PASS — 2 Playwright projects |
| `extension-local-only` | `npm test -- -t @claim:extension-local-only` | PASS — 1 test |

`scripts/verify-dist.mjs` also confirms that every listed claim ID occurs in exactly one tagged test definition.

## Cold first-read test

At 1440×900, a fresh browser context showed:

- What it does: “Find near-match code typos before review” and a 22-word explanation that it compares newly introduced VS Code tokens with local repository vocabulary.
- For whom: **not stated in plain words.** The screen does not say software engineers, reviewers, or people who experience reading friction. “Developer proof desk” is a decorative folio label, not the required audience sentence.
- What to click: “Download for VS Code” is the visually primary action. “Try it with sample data” is also visible in the first viewport.

Keyboard-activating “Try it with sample data” once opened `/demo/`, displayed “Demo — sample data, nothing is saved,” and immediately showed two explained comparisons. The one-click demo requirement passes, but the explicit rule says the candidate fails if any of what/for-whom/first-action is missing. The audience requirement fails.

Evidence: `verification-evidence/live-cold-desktop.png`, `verification-evidence/live-demo-after-one-click.png`, and `verification-evidence/first-read.json`.

## Local install, build, and package verification

- `npm ci`: PASS — 296 packages installed, 297 audited, 0 vulnerabilities.
- `npm run check`: PASS — TypeScript and 10/10 Vitest tests.
- `npm run build`: PASS — Chromium MV3, ZIP, VS Code compilation, VSIX, static site, and deploy verifier.
- `npm run test:e2e`: PASS — 16/16 across desktop and 390×844 projects.
- `npm run test:extension`: PASS — unpacked Chromium popup replacement/Undo/dismiss, content-script finding, axe, and error checks.
- `npm run test:vscode`: **FAIL** after the clean worker's missing GTK 3 runtime was installed. It failed the same product assertion on three consecutive runs.
- `npm run qa`: **FAIL** because it includes the failing VS Code host test.

The live VSIX installed successfully into a clean extensions directory and listed as `sociobot.context-check@1.1.0`. Installation therefore works; behavior after activation is the blocker.

### VS Code failure evidence

The official VS Code 1.135 extension host opens `target.ts`, whose saved text ends in `databse_ur`, and types the final `l`. The expected trusted repository token is `database_url`. The extension instead emits:

```text
databse_url looks like existing databse_ur. “databse_url” is 1 character longer than “databse_ur”.
```

The assertion expecting `databse_url looks like existing database_url` fails at `tests/vscode/suite.cjs:31`. A direct call to the packaged matcher with the same two workspace documents produces the same `databse_url → databse_ur` finding.

The cause is visible in `vscode/extension.ts`: `refreshVocabulary()` indexes every permitted file, including the file being edited and its saved partial token. `showFindings()` then compares the new line against that cached partial token. Because it is an equally near or nearer match, file enumeration order can make the tool recommend the just-typed prefix instead of the established repository token.

Full output: `verification-evidence/vscode-integration.log`.

## Live end-to-end and browser evidence

Fresh desktop and 390×844 contexts exercised the smallest browser demo:

- Sample data: 2 findings, including `databse_url → database_url` and `paymentRetyrCount → paymentRetryCount`.
- Normal exact token: `database_url → database_url` reports “No close matches found.”
- Empty required side: reports “Add both existing project words and changed text to make a comparison.”
- Short-token boundary: `abc` / `acb` is ignored and reports no close match.
- Filename/command case: `./deply-production.sh → deploy-production.sh` produces one explained finding.
- `Ctrl+Enter`, button activation, keyboard activation of the demo link, and Reset demo work.
- Demo state creates no cookies, localStorage, or sessionStorage entries.
- All observed requests during landing and the complete demo flow were same-origin. No analytics, model, font-CDN, or third-party request occurred.
- Root, demo, privacy, and terms returned 200; an unknown route returned the product 404 with status 404. Every internal link returned 200.
- No root/demo console or page errors occurred. The 404 document produced only Chromium's expected failed-resource message for its 404 navigation.
- Desktop and mobile axe scans found zero serious/critical findings on root, demo, privacy, terms, and 404.
- Clean keyboard traversal exposes a 3px proof-red focus indicator; first Tab reveals and focuses the skip link. Reduced motion leaves no animation or transition over 0.01ms. There is no 390px horizontal overflow.
- `/opt/fleet/lib/verify-url.sh` passed: title, `lang=en`, one h1, main, complete image alt text, labeled buttons, and zero root console errors.

The site is static and exposes no product API, unlock endpoint, account, or sign-in. Rate-limit and Entra checks are therefore not applicable. It is not a PWA and registers no service worker, so PWA update/offline checks are not applicable.

## Headers, identity, and budgets

The live root sends CSP, `Referrer-Policy: no-referrer`, Permissions Policy, HSTS, and `X-Content-Type-Options: nosniff`. Hashed assets send `Cache-Control: public, max-age=31536000, immutable`; downloads send a one-hour public cache policy.

The candidate differs from deployed parent `107e665e7b362286b58c8e24765b507a0c644c1e` only by builder handoff documentation. Freshly built root HTML and all tested HTML/CSS/JS/images match live byte for byte. Key hashes:

- Root HTML local/live: `ece9b3bb0aa378527193fe1161c5783e9a8a9e4e07047ed1b984200e9dc5339a`.
- Main JS local/live: `1772839c057d6a8861d79fb16f8c1b7602fd4ddb457933cefc4a0965c6008fab`.
- VSIX and Chromium ZIP container hashes change on rebuild because archive timestamps are nondeterministic; recursive comparison of every extracted file was identical.

Budgets pass: initial JS 5,281 bytes (2.51 KB gzip), main CSS 9,908 bytes (2.95 KB gzip), no fonts, mobile hero AVIF 38,600 bytes, and Chromium MV3 output 50,703 bytes. Fresh Lighthouse 12.8.2 mobile results: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.0s, CLS 0, TBT 30ms, Speed Index 1.1s, total transfer 48 KiB.

## Defects

### Blocker — primary VS Code workflow recommends the partial token being edited

`npm run test:vscode` fails reproducibly because the extension includes the edited file's saved pre-change token in repository vocabulary. In the shipped fixture, typing the final character of `databse_url` recommends `databse_ur`, not the established `database_url`. This breaks the brief's central job and causes the repository's full `npm run qa` gate to fail.

Required correction: exclude the changed document/current prior token from candidate vocabulary, or otherwise rank established cross-file vocabulary ahead of the edited token. Add a deterministic regression covering both workspace file orders, then require the complete VS Code host test to pass from a fresh profile.

### Blocker — the first screen does not plainly identify its intended user

The first screen explains the operation and exposes the demo, but it has no plain sentence saying who the product is for. The work order makes this an automatic failure. Add a concise audience/situation sentence for software engineers and reviewers who need help distinguishing plausible code-token mistakes, without diagnosing or labeling a person.

### Major — visitor-facing claims are missing from `.factory/claims.json`

The landing page and README make independently actionable promises that are not registered, including VS Code Quick Fix with native Undo and exact-pair dismissal, Chromium checking on GitHub pull/commit/compare pages, and indexing up to 300 permitted local files. “Free” and VS Code 1.85+ compatibility are also visitor-reliance claims. Some have untagged integration coverage, but the claims contract requires every claim to have its own registry entry and exactly one tagged sandbox test.

### Major — headings and labels violate the supplied plain-words contract

The copy uses metaphor/mood labels that the contract explicitly forbids: “Developer proof desk,” “The proof sheet,” “See what ‘almost’ looks like,” “A quiet check, right where the change begins,” “No cloud in the loop,” and “Questions before you pin it.” These headings do not name their sections directly. `.factory/copy-audit.md` checks word counts and banned marketing words but does not flag this prohibited metaphor copy.

### Minor — several mobile targets remain below 44px

At 390px, measured targets below the stated 44×44px baseline include the 37px-high footer home link on root/demo, the 20px-high privacy issue-tracker link, and the 20px-high 404 “Return home” and “Try sample data” links. The skip link measures 43.6px high. The existing automated touch-target test checks only a selected subset and misses these controls.

## Required next steps

1. Correct the VS Code vocabulary logic and make `npm run qa` pass on a clean worker.
2. Rewrite the first-screen audience sentence and metaphor headings to satisfy the supplied plain-words contract.
3. Register and uniquely tag tests for every visitor-facing claim.
4. Bring every mobile interactive target to at least 44×44 CSS px and expand the target audit to all routes.
