import * as vscode from 'vscode';
import { extractTokens, makePairKey, pathIsDisabled } from '../src/core/checker';
import type { Finding } from '../src/core/types';
import { checkWorkspaceChange, repositoryVocabulary, type WorkspaceDocument } from '../src/vscode/workspace-check';

const SOURCE = 'Context Check';
const decoder = new TextDecoder();
let documents: WorkspaceDocument[] = [];
let diagnostics: vscode.DiagnosticCollection;
let context: vscode.ExtensionContext;
const findingByRange = new Map<string, Finding>();

function settings() {
  const configuration = vscode.workspace.getConfiguration('contextCheck');
  return {
    enabled: configuration.get<boolean>('enabled', true),
    disabledPaths: configuration.get<string[]>('disabledPaths', ['.env*', '**/secrets/**', '**/*.pem']),
    maxWorkspaceFiles: configuration.get<number>('maxWorkspaceFiles', 300)
  };
}

function dismissedPairs(): string[] {
  return context.globalState.get<string[]>('dismissedPairs', []);
}

function rangeKey(uri: vscode.Uri, range: vscode.Range): string {
  return `${uri.toString()}:${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}`;
}

function pathFor(uri: vscode.Uri): string {
  const root = vscode.workspace.getWorkspaceFolder(uri)?.uri;
  return root ? vscode.workspace.asRelativePath(uri, false) : uri.fsPath;
}

function isEligible(uri: vscode.Uri): boolean {
  const config = settings();
  return config.enabled && !pathIsDisabled(pathFor(uri), config.disabledPaths);
}

async function refreshVocabulary(): Promise<void> {
  const config = settings();
  const files = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,dist}/**', config.maxWorkspaceFiles);
  const indexed: WorkspaceDocument[] = [];
  for (const uri of files) {
    const path = pathFor(uri);
    if (pathIsDisabled(path, config.disabledPaths)) continue;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      // Skip binary and unusually large data without inspecting or retaining it.
      if (bytes.byteLength > 512 * 1024 || bytes.includes(0)) continue;
      indexed.push({ path, text: decoder.decode(bytes) });
    } catch {
      // An unreadable file is simply absent from the local vocabulary.
    }
  }
  documents = indexed;
  vscode.window.setStatusBarMessage(`Context Check indexed ${documents.length} local files.`, 3500);
}

function documentRange(change: vscode.TextDocumentContentChangeEvent, token: { start: number; end: number; line: number }): vscode.Range {
  const lines = change.text.split('\n');
  const before = lines.slice(0, token.line - 1).join('\n');
  const startLine = change.range.start.line + token.line - 1;
  const startCharacter = (token.line === 1 ? change.range.start.character : 0) + token.start - (before ? before.length + 1 : 0);
  const endCharacter = startCharacter + token.end - token.start;
  return new vscode.Range(startLine, startCharacter, startLine, endCharacter);
}

function showFindings(document: vscode.TextDocument, changedText: string, change?: vscode.TextDocumentContentChangeEvent): void {
  if (!isEligible(document.uri)) {
    diagnostics.delete(document.uri);
    return;
  }
  const snapshot = documents.filter((entry) => entry.path !== pathFor(document.uri));
  const findings = checkWorkspaceChange(snapshot, changedText, settings().disabledPaths, { dismissedPairs: dismissedPairs() });
  const occurrences = extractTokens(changedText);
  const next: vscode.Diagnostic[] = [];
  findingByRange.clear();
  for (const finding of findings) {
    const occurrence = occurrences.find((token) => token.value === finding.introduced && token.line === finding.line);
    if (!occurrence) continue;
    const range = change ? documentRange(change, occurrence) : document.getWordRangeAtPosition(document.positionAt(occurrence.start));
    if (!range) continue;
    const diagnostic = new vscode.Diagnostic(range, `${finding.introduced} looks like existing ${finding.existing}. ${finding.explanation}`, vscode.DiagnosticSeverity.Information);
    diagnostic.source = SOURCE;
    diagnostic.code = finding.pairKey;
    next.push(diagnostic);
    findingByRange.set(rangeKey(document.uri, range), finding);
  }
  diagnostics.set(document.uri, next);
}

function updateCachedDocument(document: vscode.TextDocument): void {
  const path = pathFor(document.uri);
  documents = documents.filter((entry) => entry.path !== path);
  if (isEligible(document.uri)) documents.push({ path, text: document.getText() });
}

export async function activate(extensionContext: vscode.ExtensionContext): Promise<void> {
  context = extensionContext;
  diagnostics = vscode.languages.createDiagnosticCollection('context-check');
  context.subscriptions.push(diagnostics);
  await refreshVocabulary();

  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
    if (!event.contentChanges.length || !isEligible(event.document.uri)) return;
    for (const change of event.contentChanges) showFindings(event.document, change.text, change);
    updateCachedDocument(event.document);
  }));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(updateCachedDocument));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('contextCheck')) void refreshVocabulary();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('contextCheck.scanWorkspace', async () => {
    await refreshVocabulary();
    const editor = vscode.window.activeTextEditor;
    if (editor && isEligible(editor.document.uri)) showFindings(editor.document, editor.document.getText());
  }));
  context.subscriptions.push(vscode.commands.registerCommand('contextCheck.dismissPair', async (pairKey: string) => {
    const next = [...new Set([...dismissedPairs(), pairKey])];
    await context.globalState.update('dismissedPairs', next);
    diagnostics.clear();
    vscode.window.showInformationMessage('Context Check dismissed this exact comparison locally. Use “Refresh repository vocabulary” to check again.');
  }));
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, {
    provideCodeActions(document, range, actionContext) {
      return actionContext.diagnostics
        .filter((diagnostic) => diagnostic.source === SOURCE)
        .flatMap((diagnostic) => {
          const finding = findingByRange.get(rangeKey(document.uri, diagnostic.range));
          if (!finding) return [];
          const replace = new vscode.CodeAction(`Use existing “${finding.existing}”`, vscode.CodeActionKind.QuickFix);
          replace.diagnostics = [diagnostic];
          replace.edit = new vscode.WorkspaceEdit();
          replace.edit.replace(document.uri, diagnostic.range, finding.existing);
          const dismiss = new vscode.CodeAction('Dismiss this comparison', vscode.CodeActionKind.QuickFix);
          dismiss.diagnostics = [diagnostic];
          dismiss.command = { command: 'contextCheck.dismissPair', title: 'Dismiss this comparison', arguments: [finding.pairKey] };
          return [replace, dismiss];
        });
    }
  }, { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }));
  context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file' }, {
    provideHover(document, position) {
      const diagnostic = diagnostics.get(document.uri)?.find((item) => item.range.contains(position));
      const finding = diagnostic && findingByRange.get(rangeKey(document.uri, diagnostic.range));
      return finding ? new vscode.Hover(`${finding.explanation}\n\nUse Quick Fix to use the existing token or dismiss this exact comparison.`) : undefined;
    }
  }));
}

export function deactivate(): void {
  diagnostics?.dispose();
}
