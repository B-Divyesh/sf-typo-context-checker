export type TokenKind = 'identifier' | 'config key' | 'filename' | 'command';

export interface TokenOccurrence {
  value: string;
  kind: TokenKind;
  start: number;
  end: number;
  line: number;
}

export interface Finding {
  introduced: string;
  existing: string;
  kind: TokenKind;
  line: number;
  distance: number;
  explanation: string;
  pairKey: string;
}

export interface CheckOptions {
  dismissedPairs?: string[];
  maxFindings?: number;
}
