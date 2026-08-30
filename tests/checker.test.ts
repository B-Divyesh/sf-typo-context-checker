import { describe, expect, it } from 'vitest';
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

  it('matches exact, wildcard, and substring disabled paths', () => {
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

  it('checks a newly introduced token against local repository vocabulary and excludes sensitive paths', () => {
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
});
