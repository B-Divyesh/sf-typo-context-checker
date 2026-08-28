# Context Check v1 handoff

Date: 2026-08-28  
Work order: `typo-context-checker-build-1`  
Deploy root: `dist/site/`

## What shipped

- WXT + TypeScript Manifest V3 extension for Chromium.
- GitHub pull-request, commit, and compare-page checks. Added lines are compared with filenames and nearby context/deletion tokens; possible identifier, config-key, filename, and command confusions receive an inline, keyboard-focusable explanation.
- Local popup proof sheet for pasted trusted vocabulary and changed lines, with “Use existing,” dismiss, and undo actions.
- Extension-local settings for enabling GitHub checks, excluding sensitive paths, and clearing dismissed token pairs. Defaults exclude `.env*`, secret directories, and PEM files.
- Badge count and page summary; no score, diagnosis, remote model, analytics, account, or source upload.
- Responsive static landing site with the same local matcher, installation instructions, privacy and terms pages, cache/security headers, robots metadata, and packaged extension download.
- Product-specific monochrome broadsheet system and original generated proofreader hero documented in `.factory/design.md`.

## Scope decision

The research brief describes a VS Code extension, while the binding work order specifies a WXT MV3 browser extension plus static site. This build follows the work order and brings the job into GitHub review: it checks visible diff context and supplies a paste-in checker for work from other editors. It does not claim to index an entire repository.

## Run and verify

```sh
npm ci
npm run check
npm run build
npm run test:e2e
```

`npm run build` creates `dist/chrome-mv3/`, `dist/site/index.html`, and `dist/site/downloads/context-check-chrome.zip`.

Verification completed on 2026-08-28:

- `npm ci`: passed from the lockfile.
- `npm audit`: 0 known vulnerabilities.
- `npm run check`: TypeScript passed; 6/6 matcher tests passed.
- `npm run build`: passed; deploy-root verification passed.
- `npm run test:e2e`: 6/6 Chromium tests passed across desktop and 390×844 mobile, including full axe scans on the landing, privacy, and terms pages and a console-error assertion.
- Packaged-extension smoke test: loaded `dist/chrome-mv3` unpacked in Chromium; popup produced `databse_url → database_url`; zero serious/critical axe violations and zero console errors.
- GitHub content-script smoke test: a locally intercepted pull-request fixture produced the same inline comparison and a summary count of 1.
- Mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 0.9 s, CLS 0, total blocking time 0 ms, speed index 0.9 s.
- Initial site JavaScript: 5,281 bytes; site CSS: 9.08 KB main + 1.51 KB legal; extension total: 50.02 KB; packaged zip: 32 KB.
- Hero: 40 KB mobile AVIF / 64 KB mobile WebP; 132 KB large AVIF / 192 KB large WebP.

## Privacy and accessibility

All matching and persistence happen in the browser. The runtime contains no third-party scripts, CDN fonts, telemetry, or network API call. Extension access is limited to GitHub plus local storage/active-tab metadata. The site has one h1 per page, landmarks, skip links, explicit labels, 44 px controls, designed focus states, reduced-motion handling, responsive 390 px behavior, and text alternatives for the hero.

## Known gaps and next steps

- The extension sees visible GitHub diff context, not a complete repository vocabulary. A later opt-in version could cache vocabulary gathered during repository browsing without uploading it.
- GitHub can change its diff DOM. Add maintained fixtures for new GitHub layouts before store release.
- The shipped zip is an unsigned developer-mode package. Submit the same MV3 build to Chrome/Edge stores after factory review.
- Firefox and Safari packaging were not tested in v1.
