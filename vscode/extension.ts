import * as vscode from 'vscode';
import { extractTokens, makePairKey, pathIsDisabled } from '../src/core/checker';
import type { Finding } from '../src/core/types';
import { changedLineSlice, checkWorkspaceChange, type WorkspaceDocument } from '../src/vscode/workspace-check';

const SOURCE = 'Context Check';
const decoder = new TextDecoder();
let documents: WorkspaceDocument[] = [];
let diagnostics: vscode.DiagnosticCollection;
let context: vscode.ExtensionContext;
const findingByPair = new Map<string, Finding>();

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

function documentRange(document: vscode.TextDocument, startLine: number, token: { start: number; end: number; line: number }): vscode.Range {
  const absoluteLine = startLine + token.line - 1;
  const lineStart = document.offsetAt(new vscode.Position(absoluteLine, 0));
  return new vscode.Range(document.positionAt(lineStart + token.start), document.positionAt(lineStart + token.end));
}

function showFindings(document: vscode.TextDocument, changedText: string, startLine = 0): void {
  if (!isEligible(document.uri)) {
    diagnostics.delete(document.uri);
    return;
  }
  const findings = checkWorkspaceChange(documents, changedText, settings().disabledPaths, { dismissedPairs: dismissedPairs() });
  const occurrences = extractTokens(changedText);
  const endLine = startLine + Math.max(0, changedText.split('\n').length - 1);
  const previous = diagnostics.get(document.uri) ?? [];
  const next: vscode.Diagnostic[] = previous.filter((item) => item.range.end.line < startLine || item.range.start.line > endLine);
  for (const finding of findings) {
    const occurrence = occurrences.find((token) => token.value === finding.introduced && token.line === finding.line);
    if (!occurrence) continue;
    const range = documentRange(document, startLine, occurrence);
    const diagnostic = new vscode.Diagnostic(range, `${finding.introduced} looks like existing ${finding.existing}. ${finding.explanation}`, vscode.DiagnosticSeverity.Information);
    diagnostic.source = SOURCE;
    diagnostic.code = finding.pairKey;
    next.push(diagnostic);
    findingByPair.set(finding.pairKey, finding);
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
    for (const change of event.contentChanges) {
      const slice = changedLineSlice(event.document.getText(), change.range.start.line, change.text);
      showFindings(event.document, slice.text, slice.startLine);
    }
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
    diagnostics.forEach((uri, current) => {
      diagnostics.set(uri, current.filter((diagnostic) => diagnostic.code !== pairKey));
    });
    vscode.window.showInformationMessage('Context Check dismissed this exact comparison locally.');
  }));
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, {
    provideCodeActions(document, range, actionContext) {
      return actionContext.diagnostics
        .filter((diagnostic) => diagnostic.source === SOURCE)
        .flatMap((diagnostic) => {
          const finding = typeof diagnostic.code === 'string' ? findingByPair.get(diagnostic.code) : undefined;
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
      const finding = diagnostic && typeof diagnostic.code === 'string' ? findingByPair.get(diagnostic.code) : undefined;
      return finding ? new vscode.Hover(`${finding.explanation}\n\nUse Quick Fix to use the existing token or dismiss this exact comparison.`) : undefined;
    }
  }));
}

export function deactivate(): void {
  diagnostics?.dispose();
}
