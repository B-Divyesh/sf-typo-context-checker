import { checkContext, pathIsDisabled } from '../core/checker';
import type { CheckOptions, Finding } from '../core/types';

export interface WorkspaceDocument {
  path: string;
  text: string;
}

export interface ChangedLineSlice {
  startLine: number;
  text: string;
}

/** Build only from permitted local workspace documents; callers never send it anywhere. */
export function repositoryVocabulary(documents: WorkspaceDocument[], disabledPaths: string[]): string {
  return documents
    .filter((document) => !pathIsDisabled(document.path, disabledPaths))
    .map((document) => `${document.path}\n${document.text}`)
    .join('\n');
}

export function checkWorkspaceChange(
  documents: WorkspaceDocument[],
  changedText: string,
  disabledPaths: string[],
  options: CheckOptions = {}
): Finding[] {
  return checkContext(repositoryVocabulary(documents, disabledPaths), changedText, options);
}

/** Read complete current lines after an editor change, so normal one-character typing is checkable. */
export function changedLineSlice(documentText: string, startLine: number, insertedText: string): ChangedLineSlice {
  const lines = documentText.split('\n');
  const insertedLineCount = insertedText.split('\n').length;
  return {
    startLine,
    text: lines.slice(startLine, startLine + insertedLineCount).join('\n')
  };
}
