# Context Check

Context Check is a free, local-first VS Code extension for developers who want a deliberate second look at visually plausible identifiers, config keys, filenames, and commands. It compares newly introduced tokens with vocabulary from permitted local repository files, then presents an explainable inline diagnostic with Quick Fix actions. A Chromium companion preserves the same check on GitHub pull requests, commits, and compare pages.

It is accessibility-minded but does not diagnose, score, or label anyone. Source text is never uploaded.

Live site: <https://typo-context-checker.sociobot.in>

One-click sample: <https://typo-context-checker.sociobot.in/demo/>. It uses bundled sample text and saves nothing.

## What version 1 includes

- Local VS Code workspace vocabulary with inline diagnostics for newly introduced tokens
- VS Code Quick Fix actions to use the existing token (with native Undo) or dismiss the exact pair
- Configurable VS Code sensitive-path exclusions (`.env*`, secret directories, and PEM files by default)
- GitHub diff checking on `pull`, `commit`, and `compare` pages via the Chromium companion
- Damerau–Levenshtein and common visual-confusion matching
- Plain-language comparisons that name the introduced and existing token
- Exact-pair dismissal with an undo path in the Chromium popup
- Configurable sensitive-path exclusions (`.env*`, secret directories, and PEM files by default)
- A popup proof sheet for text pasted from any editor
- A static landing page with the same local matcher, privacy policy, and terms

The extension does not alter GitHub, modify source, block merges, call a model, or contact a product server.

## Install the VS Code extension

1. Download `context-check-vscode.vsix` from the live site or `dist/site/downloads/` after building.
2. In VS Code, open the Extensions view, use **Install from VSIX…**, and select the downloaded file.
3. Open a local repository. Context Check indexes up to 300 permitted local files and checks newly inserted tokens as you edit.
4. Run **Context Check: Refresh repository vocabulary** after a large repository change. Open Quick Fix on an inline diagnostic to use the existing token or dismiss that exact pair.

## Install the Chromium companion

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
npm run test:extension # packaged Chromium popup/content integration (Linux + Xvfb)
npm run test:vscode  # packaged VS Code host integration (Linux GUI libraries + Xvfb)
npm run check        # TypeScript + unit tests
npm run build        # complete reproducible production build
npm run qa           # all type, unit, build, site, Chromium, and VS Code gates
```

`npm run build` writes:

- `dist/chrome-mv3/` — unpacked Manifest V3 extension
- `dist/vscode-extension/` — compiled local VS Code extension
- `dist/site/` — deployable static site (with `index.html` at the root)
- `dist/site/downloads/context-check-chrome.zip` — packaged Chromium companion
- `dist/site/downloads/context-check-vscode.vsix` — installable local VS Code extension

The site build uses Vite and vanilla TypeScript. The extension uses WXT with no runtime framework. Unit tests run in Vitest and browser checks run in Playwright 1.58.2.

## Privacy and permissions

The extension requests:

- `storage` to save browser-companion settings, dismissed pairs, and the current page result locally
- `activeTab` so the popup can describe the active GitHub page
- access to `https://github.com/*` for visible diff checking

The VS Code extension uses the VS Code local workspace API to read permitted files and keeps its vocabulary and dismissed pairs on-device. There are no third-party scripts, CDN fonts, analytics SDKs, accounts, or network calls. See [the privacy policy](https://typo-context-checker.sociobot.in/privacy/) for details.

## Product sources

- [Research brief](.factory/brief.json)
- [Visual thesis and generated-asset provenance](.factory/design.md)
- [Build handoff](.factory/handoff.md)

## License

MIT © 2026 Sociobot (Param Factory).
