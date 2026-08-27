import type { CheckOptions, Finding, TokenKind, TokenOccurrence } from './types';

const COMMON = new Set([
  'about', 'after', 'array', 'async', 'await', 'boolean', 'break', 'button', 'catch', 'class', 'const',
  'continue', 'default', 'delete', 'document', 'else', 'error', 'export', 'false', 'finally', 'for', 'from',
  'function', 'import', 'interface', 'length', 'null', 'number', 'object', 'package', 'private', 'public',
  'return', 'static', 'string', 'switch', 'throw', 'true', 'typeof', 'undefined', 'value', 'while', 'window'
]);

const TOKEN_RE = /(?:\.\.?\/)?[\w@][\w@./:-]*[\w@]|[A-Za-z_$][\w$]*/g;
const COMMANDS = new Set(['npm', 'npx', 'pnpm', 'yarn', 'git', 'docker', 'kubectl', 'curl', 'wget', 'cargo', 'go', 'python', 'node', 'bash', 'sh']);

export function normalizeToken(token: string): string {
  return token.replace(/^['"`]|['"`,;)]$/g, '').replace(/^(?:\.\.\/|\.\/)+/, '').toLowerCase();
}

function classify(value: string, lineText: string): TokenKind {
  if (/[/\\]|\.[a-z0-9]{1,8}$/i.test(value)) return 'filename';
  if (/^[\w-]+[=:]/.test(lineText.trim()) || /[-_.]/.test(value)) return 'config key';
  const first = lineText.trim().split(/\s+/)[0]?.replace(/^[$>]\s*/, '');
  if (COMMANDS.has(normalizeToken(first ?? ''))) return 'command';
  return 'identifier';
}

export function extractTokens(text: string): TokenOccurrence[] {
  const tokens: TokenOccurrence[] = [];
  let offset = 0;
  text.split('\n').forEach((lineText, lineIndex) => {
    TOKEN_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TOKEN_RE.exec(lineText))) {
      const value = match[0];
      const normalized = normalizeToken(value);
      if (normalized.length >= 4 && /[a-z]/i.test(normalized) && !COMMON.has(normalized)) {
        tokens.push({
          value,
          kind: classify(value, lineText),
          start: offset + match.index,
          end: offset + match.index + value.length,
          line: lineIndex + 1
        });
      }
    }
    offset += lineText.length + 1;
  });
  return tokens;
}

export function damerauLevenshtein(a: string, b: string): number {
  const left = normalizeToken(a);
  const right = normalizeToken(b);
  const matrix = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0));
  for (let i = 0; i <= left.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
      }
    }
  }
  return matrix[left.length][right.length];
}

function shape(token: string): string {
  return normalizeToken(token).replace(/[0o]/g, 'o').replace(/[1il]/g, 'l').replace(/rn/g, 'm').replace(/vv/g, 'w');
}

function allowedDistance(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  return maxLength >= 9 ? 2 : 1;
}

function explain(introduced: string, existing: string, distance: number): string {
  const a = normalizeToken(introduced);
  const b = normalizeToken(existing);
  if (shape(a) === shape(b)) return `The characters in “${introduced}” can look like “${existing}”.`;
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  if (a.length === b.length && distance === 1 && prefix + 1 < a.length) {
    if (a[prefix] === b[prefix + 1] && a[prefix + 1] === b[prefix]) {
      return `Characters ${prefix + 1} and ${prefix + 2} are reversed compared with “${existing}”.`;
    }
    return `Character ${prefix + 1} is “${introduced[prefix]}” here and “${existing[prefix]}” in the existing token.`;
  }
  if (a.length !== b.length) {
    return `“${introduced}” is ${Math.abs(a.length - b.length)} character ${a.length > b.length ? 'longer' : 'shorter'} than “${existing}”.`;
  }
  return `“${introduced}” is ${distance} edits from the existing token “${existing}”.`;
}

export function makePairKey(introduced: string, existing: string): string {
  return `${normalizeToken(introduced)}→${normalizeToken(existing)}`;
}

export function checkContext(existingText: string, introducedText: string, options: CheckOptions = {}): Finding[] {
  const existing = extractTokens(existingText);
  const introduced = extractTokens(introducedText);
  const existingByNormalized = new Map(existing.map((token) => [normalizeToken(token.value), token]));
  const dismissed = new Set(options.dismissedPairs ?? []);
  const findings = new Map<string, Finding>();

  for (const candidate of introduced) {
    const candidateNorm = normalizeToken(candidate.value);
    if (existingByNormalized.has(candidateNorm)) continue;
    let nearest: TokenOccurrence | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const known of existing) {
      const knownNorm = normalizeToken(known.value);
      if (Math.abs(candidateNorm.length - knownNorm.length) > 2) continue;
      const distance = damerauLevenshtein(candidateNorm, knownNorm);
      const visuallyConfusable = shape(candidateNorm) === shape(knownNorm);
      if ((distance <= allowedDistance(candidateNorm, knownNorm) || visuallyConfusable) && distance < nearestDistance) {
        nearest = known;
        nearestDistance = distance;
      }
    }
    if (!nearest) continue;
    const pairKey = makePairKey(candidate.value, nearest.value);
    if (dismissed.has(pairKey) || findings.has(pairKey)) continue;
    findings.set(pairKey, {
      introduced: candidate.value,
      existing: nearest.value,
      kind: candidate.kind === 'identifier' ? nearest.kind : candidate.kind,
      line: candidate.line,
      distance: nearestDistance,
      explanation: explain(candidate.value, nearest.value, nearestDistance),
      pairKey
    });
    if (findings.size >= (options.maxFindings ?? 30)) break;
  }
  return [...findings.values()];
}

export function pathIsDisabled(path: string, patterns: string[]): boolean {
  return patterns.some((rawPattern) => {
    const pattern = rawPattern.trim();
    if (!pattern) return false;
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i').test(path) || path.toLowerCase().includes(pattern.toLowerCase());
  });
}
