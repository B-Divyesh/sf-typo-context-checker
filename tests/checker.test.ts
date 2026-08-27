import { describe, expect, it } from 'vitest';
import { checkContext, damerauLevenshtein, extractTokens, makePairKey, pathIsDisabled } from '../src/core/checker';

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
    expect(pathIsDisabled('src/secrets/token.ts', ['**/secrets/**'])).toBe(true);
    expect(pathIsDisabled('src/public/app.ts', ['secrets'])).toBe(false);
  });
});
