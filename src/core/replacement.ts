/**
 * Creates the smallest safe text change for a suggested replacement.
 * Keeping the original text alongside the result gives every caller a
 * deterministic, lossless Undo path.
 */
export interface SuggestedReplacement {
  before: string;
  after: string;
}

export function replaceFirstSuggestion(text: string, introduced: string, existing: string): SuggestedReplacement {
  return {
    before: text,
    after: text.replace(introduced, existing)
  };
}
