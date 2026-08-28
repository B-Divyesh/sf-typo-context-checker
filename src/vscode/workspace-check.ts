import { checkContext, pathIsDisabled } from '../core/checker';
import type { CheckOptions, Finding } from '../core/types';

export interface WorkspaceDocument {
  path: string;
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
