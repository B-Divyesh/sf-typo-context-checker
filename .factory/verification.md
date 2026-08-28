# Independent verification 1 — FAIL

Date: 2026-08-28  
Work order: `typo-context-checker-verify-1`  
Candidate: `9b04971930155bd4a96e90167276fe9d330b3fdb` (`9b04971`)  
Live URL: <https://typo-context-checker.sociobot.in/>  
Verifier scope: clean-install, production build/package, local extension, and deployed static site. No product code was modified.

## Result

**FAIL.** The Chromium extension and its landing site are healthy within their implemented scope, but the candidate does not satisfy the researched brief's smallest useful product: a local VS Code extension that compares newly introduced code with repository vocabulary. The candidate is a Chrome MV3 extension restricted to GitHub pull/commit/compare pages and only uses visible diff context. This is a material product-scope substitution, not an equivalent implementation.

## Reproducible evidence

Executed from a clean checkout at the candidate SHA:

```sh
npm ci
npm run check
npm run build
npm run test:e2e
```

- `npm ci` passed; audit reported 0 vulnerabilities.
- `npm run check` passed: TypeScript and 6/6 Vitest matcher tests.
- Exact `npm run build` passed: Chrome MV3 build, packaged ZIP, Vite static build, and `scripts/verify-dist.mjs`.
- `npm run test:e2e` passed: 6/6 Playwright desktop and 390×844 mobile tests.
- Built budgets: initial JS 5,281 bytes; main CSS 9,079 bytes; legal CSS 1,510 bytes; extension output 50,023 bytes; mobile hero AVIF 38,600 bytes. All are within the stated budgets.

## Independent end-to-end checks

Loaded `dist/chrome-mv3/` unpacked in Chromium under Xvfb and exercised the actual popup/content script against intercepted GitHub PR fixtures.

- Normal flow: `databse_url → database_url`, `retyrCount → retryCount`, and `./deply-production.sh → deploy-production.sh` yielded three readable, explained findings with no console/page errors.
- Content script placed the inline note and one-item summary on a GitHub PR fixture. Dismissing the pair removed it; popup dismissal offered Undo and restored it.
- Sensitive defaults worked: `.env.production` and `src/secrets/token.ts` produced zero injected notes.
- Boundary/recovery: exact text and 3-character `abc`/`acb` produced “No close matches found”; blank trusted vocabulary produced the focused, announced “Both text areas are needed” recovery message.
- Keyboard: Ctrl+Enter ran the popup checker; initial Tab lands on the visible skip link. Popup axe scan reported zero serious/critical findings and no errors.
- The extension manifest contains only `storage` and `activeTab` permissions plus GitHub host permission. Static source scan found no fetch/XHR/WebSocket/beacon/analytics endpoint; the browser test observed only GitHub and extension-origin requests.

Live deployment checks at the stated URL:

- Landing, privacy, and terms pages each have a title, `lang="en"`, exactly one `h1`, and one `main`; axe reported zero serious/critical findings on desktop and 390px mobile.
- Desktop and 390px local checker flows produced both the no-match state and the explained `databse_url → database_url` finding. No console/page errors, no horizontal overflow, and only `typo-context-checker.sociobot.in` was requested on first load.
- First Tab focused the visible skip link. Under reduced motion, finding animation and transition durations computed to `0.00001s`.
- Lighthouse 12.8.2 (mobile preset) on the live root: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.0 s, CLS 0, TBT 30 ms, Speed Index 0.9 s.
- Live `index.html` SHA-256 equals locally built `dist/site/index.html`: `5ffdd672379e3b504e34a485002df876f236ae9ee5da22b5f9833524fa2b8ec9`. Referenced JS, CSS, hero AVIF, and legal CSS matched byte-for-byte. The downloaded ZIP container hash differs due to archive metadata, but every extracted file hash matches the local package.

## Defects

### Blocker — the artifact does not implement the brief's core job in VS Code

The researched acceptance contract calls for a **local VS Code extension** that highlights newly introduced near-matches using **repository vocabulary** before defects reach review. `wxt.config.ts` instead builds a Chromium MV3 extension with host permission only for `https://github.com/*`; `entrypoints/content.ts` runs only on GitHub `pull`, `commit`, and `compare` URLs and derives vocabulary from the visible file path plus visible context/deletion lines. It cannot run in VS Code, inspect a workspace/repository, or catch an error during local editing. The builder's handoff acknowledges this divergence. This fails the smallest-useful-product acceptance criterion.

### Major — “Use existing” is an irreversible overwrite despite the documented interaction contract

`.factory/design.md` says both “Use existing” and “Dismiss” provide an Undo action. In the actual popup, selecting `Use “database_url”` immediately replaces every occurrence in the pasted changed text, re-renders results, and focuses the textarea. No Undo control or recovery message is rendered. The verifier attempted the normal flow and confirmed no Undo appeared. Dismissal does have Undo. This is particularly risky for an accessibility-oriented proofreading aid and contradicts the required documented product behavior.

### Major — live hosting does not enforce the candidate's response/caching policy

The built `dist/site/_headers` requests `Referrer-Policy: no-referrer`, a restrictive `Permissions-Policy`, and immutable caching for hashed assets. Fresh live responses instead returned:

- HTML: `Referrer-Policy: strict-origin-when-cross-origin`; no `Permissions-Policy` and no CSP.
- Hashed `assets/main-CiEzc6W4.js`: `Cache-Control: public, must-revalidate, max-age=30`, not the expected one-year immutable cache.

The live URL does send HSTS and `X-Content-Type-Options: nosniff`, and no third-party resource was requested, but deployment response policy/caching does not match the candidate's shipped configuration or the handoff claim. The hosting configuration needs to honor the deployed headers before approval.

### Minor — several mobile touch targets are below the 44px acceptance baseline

At 390px, measured visible link targets include the wordmark (34px high), “Try a local check” (26px), and footer Privacy/Terms/Source links (26px). The product-specific design instructions require 44×44px touch/click targets. The main checker controls are usable and no overflow occurred, but these navigation targets miss the stated mobile baseline.

## Required next steps

1. Deliver the actual VS Code/local-workspace extension, including explainable inline highlights, repository vocabulary, sensitive-path controls, and dismiss action; or obtain an explicit replacement acceptance contract before treating the GitHub-only browser extension as the product.
2. Add an Undo path for “Use existing” (or confirm the replacement before changing it), then cover it with an automated extension test.
3. Correct production hosting so `_headers` response policy and immutable hashed-asset caching are actually served; recheck live headers after deploy.
4. Increase mobile navigation/footer link hit areas to at least 44×44px and repeat the 390px check.

