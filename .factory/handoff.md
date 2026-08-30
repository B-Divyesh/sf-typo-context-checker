# Context Check independent verification handoff

Date: 2026-08-30

Work order: `typo-context-checker-verify-2`

Candidate: `3d5a98edd32634755e31ca30fe549e553f1c6f12`

Live URL: <https://typo-context-checker.sociobot.in/>

## Release result

**FAIL — do not release this candidate.**

All five registered claim commands pass. The static site, demo, Chromium extension, build, privacy checks, automated accessibility scans, response policy, deployment identity, and performance budgets pass. The packaged VS Code extension's primary host integration fails reproducibly, the first screen does not name the intended user in plain words, and several visitor-facing claims are absent from the required claims registry.

Full evidence and severity-ranked defects are in [verification-2.md](verification-2.md).

## Release blockers

1. `npm run test:vscode` fails after activation. Typing the final `l` in `databse_url` produces `databse_url → databse_ur`, because the edited file's saved partial token is included in repository vocabulary. The expected established token is `database_url`. This repeated on three consecutive runs and makes `npm run qa` fail.
2. The cold first screen explains the job and provides a one-click sample, but it does not plainly say that the product is for software engineers and reviewers dealing with visually plausible code-token mistakes. The work order defines that omission as an automatic failure.
3. `.factory/claims.json` omits claims made on the site/README, including Quick Fix/Undo/dismiss behavior, Chromium GitHub-diff checking, and the 300-file indexing limit.

## Other findings

- Several 390px targets are below 44px, including the 37px-high footer home link and 20px-high inline links on privacy and 404 pages.
- Metaphorical headings and decorative labels conflict with the supplied plain-words rules.

## Verification summary

```text
npm ci                  PASS — 0 vulnerabilities
all 5 claim commands    PASS
npm run check           PASS — TypeScript + 10/10 Vitest
npm run build           PASS — full production output
npm run test:e2e        PASS — 16/16
npm run test:extension  PASS
npm run test:vscode     FAIL — wrong repository-context suggestion
npm run qa              FAIL — fails at test:vscode
verify-url.sh live      PASS
live axe                PASS — 0 serious/critical on desktop/mobile routes
Lighthouse mobile       100/100/100/100; LCP 1.0s; CLS 0; TBT 30ms
```

Live root, route assets, scripts, styles, images, and extracted VSIX/ZIP contents match the candidate build. No server-side endpoint, sign-in, rate-limit surface, or PWA service worker exists, so those checks are not applicable. No product code was changed during verification.

## Reproduce

```sh
npm ci
npm run qa
```

On a minimal Linux worker, install GTK 3 before the VS Code host test. The product assertion failure occurs after VS Code starts and is not caused by the GTK prerequisite.
