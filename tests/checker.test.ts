import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { checkContext, damerauLevenshtein, extractTokens, makePairKey, pathIsDisabled } from '../src/core/checker';
import { replaceFirstSuggestion } from '../src/core/replacement';
import { changedLineSlice, checkWorkspaceChange, repositoryVocabulary } from '../src/vscode/workspace-check';

describe('context checker', () => {
  it('finds a transposed character in a repository key', () => {
    const findings = checkContext('database_url\npaymentRetryCount', 'databse_url = value');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ introduced: 'databse_url', existing: 'database_url', distance: 1 });
  });

  it('finds a plausible command or filename near-match', () => {
    const findings = checkContext('deploy-production.sh', './deply-production.sh');
    expect(findings[0]).toMatchObject({ introduced: './deply-production.sh', existing: 'deploy-production.sh' });
  });

  it('does not flag exact or unrelated tokens', () => {
    expect(checkContext('database_url\nuserSessionToken', 'database_url\nrenderInvoice')).toEqual([]);
  });

  it('honors dismissed pairs', () => {
    const key = makePairKey('databse_url', 'database_url');
    expect(checkContext('database_url', 'databse_url', { dismissedPairs: [key] })).toEqual([]);
  });

  it('supports transposition distance and token line locations', () => {
    expect(damerauLevenshtein('retry', 'retyr')).toBe(1);
    expect(extractTokens('short\nprojectSetting')).toEqual([
      expect.objectContaining({ value: 'short', line: 1 }),
      expect.objectContaining({ value: 'projectSetting', line: 2 })
    ]);
  });

  it('@claim:sensitive-defaults excludes environment, secret, and PEM paths', () => {
    expect(pathIsDisabled('.env.local', ['.env*'])).toBe(true);
    expect(pathIsDisabled('apps/web/.env.production', ['.env*'])).toBe(true);
    expect(pathIsDisabled('src/secrets/token.ts', ['**/secrets/**'])).toBe(true);
    expect(pathIsDisabled('key.pem', ['**/*.pem'])).toBe(true);
    expect(pathIsDisabled('src/public/app.ts', ['secrets'])).toBe(false);
  });

  it('keeps the original text for an exact, one-step Use existing undo', () => {
    const replacement = replaceFirstSuggestion('databse_url = databse_url', 'databse_url', 'database_url');
    expect(replacement.after).toBe('database_url = databse_url');
    expect(replacement.before).toBe('databse_url = databse_url');
  });

  it('@claim:workspace-context checks a new token against permitted local repository vocabulary', () => {
    const documents = [
      { path: 'src/config.ts', text: 'const database_url = value;' },
      { path: '.env.production', text: 'database_url=secret-value' }
    ];
    expect(repositoryVocabulary(documents, ['.env*'])).not.toContain('secret-value');
    expect(checkWorkspaceChange(documents, 'const databse_url = value;', ['.env*']))
      .toEqual([expect.objectContaining({ introduced: 'databse_url', existing: 'database_url' })]);
  });

  it('checks the complete current line when VS Code reports one-character typing', () => {
    const current = 'const first = true;\nconst databse_url = value;\nconst last = true;';
    const slice = changedLineSlice(current, 1, 'l');
    expect(slice).toEqual({ startLine: 1, text: 'const databse_url = value;' });
    expect(checkWorkspaceChange([{ path: 'src/config.ts', text: 'export const database_url = value;' }], slice.text, []))
      .toEqual([expect.objectContaining({ introduced: 'databse_url', existing: 'database_url', line: 1 })]);
  });

  it('excludes the active document prior token regardless of workspace file order', () => {
    const activeDocument = { path: 'src/target.ts', text: 'export const databse_ur = value;' };
    const trustedDocument = { path: 'src/vocabulary.ts', text: 'export const database_url = value;' };

    for (const documents of [[activeDocument, trustedDocument], [trustedDocument, activeDocument]]) {
      expect(checkWorkspaceChange(documents, 'export const databse_url = value;', [], {
        excludedPaths: ['src/target.ts']
      })).toEqual([expect.objectContaining({ introduced: 'databse_url', existing: 'database_url' })]);
    }
  });

  it('@claim:workspace-file-limit indexes at most 300 permitted files by default', async () => {
    const manifest = JSON.parse(await readFile('vscode/package.json', 'utf8'));
    const maximum = manifest.contributes.configuration.properties['contextCheck.maxWorkspaceFiles'];
    expect(maximum.default).toBe(300);
    expect(maximum.minimum).toBe(1);
    expect(maximum.maximum).toBe(2000);
  });

  it('@claim:vscode-version supports VS Code 1.85 and later', async () => {
    const manifest = JSON.parse(await readFile('vscode/package.json', 'utf8'));
    expect(manifest.engines.vscode).toBe('^1.85.0');
  });

  it('@claim:no-paid-gate has no account, payment, or billing integration', async () => {
    const productFiles = ['README.md', 'site/index.html', 'site/privacy/index.html', 'site/terms/index.html', 'vscode/package.json', 'package.json'];
    const source = (await Promise.all(productFiles.map((path) => readFile(path, 'utf8')))).join('\n');
    expect(source).not.toMatch(/checkout|payment provider|billing API|stripe|dodo/i);
    expect(source).not.toMatch(/sign in|log in|create (an )?account/i);
  });

  it('keeps landing headings and labels direct and plain', async () => {
    const landing = await readFile('site/index.html', 'utf8');
    for (const removedLabel of [
      'Developer proof desk',
      'The proof sheet',
      'See what “almost” looks like',
      'A quiet check, right where the change begins',
      'No cloud in the loop',
      'Questions before you pin it'
    ]) {
      expect(landing).not.toContain(removedLabel);
    }
    expect(landing).toContain('For software engineers and reviewers');
    expect(landing).toContain('Compare sample code tokens');
    expect(landing).toContain('Check new code tokens as you edit');
  });

  it('@claim:extension-local-only has no source-upload or telemetry runtime', async () => {
    const runtimeFiles = [
      'vscode/extension.ts',
      'entrypoints/background.ts',
      'entrypoints/content.ts',
      'entrypoints/popup/main.ts',
      'src/core/checker.ts',
      'src/core/storage.ts',
      'src/vscode/workspace-check.ts'
    ];
    const runtime = (await Promise.all(runtimeFiles.map((path) => readFile(path, 'utf8')))).join('\n');
    expect(runtime).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/);
    expect(runtime).toMatch(/chrome\.storage\.local|globalState/);
    const manifest = await readFile('wxt.config.ts', 'utf8');
    expect(manifest).toContain("host_permissions: ['https://github.com/*']");
    expect(manifest).not.toMatch(/https?:\/\/(?!github\.com)/);
  });
});
