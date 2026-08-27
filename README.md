# Context Check

Context Check is a free, local-first Chromium extension for developers and reviewers who want a deliberate second look at visually plausible identifiers, config keys, filenames, and commands. On GitHub pull requests, commits, and compare pages it compares added tokens with surrounding repository vocabulary, then places an explainable proof note beside a close match.

It is accessibility-minded but does not diagnose, score, or label anyone. Source text is never uploaded.

Live site: <https://typo-context-checker.sociobot.in>

## What version 1 includes

- GitHub diff checking on `pull`, `commit`, and `compare` pages
- Damerau–Levenshtein and common visual-confusion matching
- Plain-language comparisons that name the introduced and existing token
- Exact-pair dismissal with an undo path
- Configurable sensitive-path exclusions (`.env*`, secret directories, and PEM files by default)
- A popup proof sheet for text pasted from any editor
- A static landing page with the same local matcher, privacy policy, and terms

The extension does not alter GitHub, modify source, block merges, call a model, or contact a product server.

## Install the packaged extension

1. Download `context-check-chrome.zip` from the live site or `dist/site/downloads/` after building.
2. Unzip it.
3. Open `chrome://extensions` (or the equivalent page in Edge/Brave).
4. Enable **Developer mode**, choose **Load unpacked**, and select the unzipped folder.
5. Open a GitHub pull request and pin Context Check for access to the paste-in checker.

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev          # WXT extension development
npm run dev:site     # landing site
npm test             # deterministic matcher tests
npm run test:e2e     # Chromium desktop/mobile + axe checks
npm run check        # TypeScript + unit tests
npm run build        # complete reproducible production build
```

`npm run build` writes:

- `dist/chrome-mv3/` — unpacked Manifest V3 extension
- `dist/site/` — deployable static site (with `index.html` at the root)
- `dist/site/downloads/context-check-chrome.zip` — packaged extension download

The site build uses Vite and vanilla TypeScript. The extension uses WXT with no runtime framework. Unit tests run in Vitest and browser checks run in Playwright 1.58.2.

## Privacy and permissions

The extension requests:

- `storage` to save settings, dismissed pairs, and the current page result locally
- `activeTab` so the popup can describe the active GitHub page
- access to `https://github.com/*` for visible diff checking

There are no third-party scripts, CDN fonts, analytics SDKs, accounts, or network calls. See [the privacy policy](https://typo-context-checker.sociobot.in/privacy/) for details.

## Product sources

- [Research brief](.factory/brief.json)
- [Visual thesis and generated-asset provenance](.factory/design.md)
- [Build handoff](.factory/handoff.md)

## License

MIT © 2026 Sociobot (Param Factory).
