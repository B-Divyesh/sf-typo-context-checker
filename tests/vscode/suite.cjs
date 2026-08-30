const assert = require('node:assert/strict');
const vscode = require('vscode');

const QUICK_FIX_CLAIM = '@claim:vscode-quick-fix-undo-dismiss';

async function until(read, predicate, message) {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    const value = read();
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(message);
}

async function codeActions(uri, range) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const actions = await vscode.commands.executeCommand('vscode.executeCodeActionProvider', uri, range);
      if (Array.isArray(actions)) return actions;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw lastError ?? new Error('VS Code did not return code actions');
}

async function run() {
  const extension = vscode.extensions.getExtension('sociobot.context-check');
  assert.ok(extension, 'packaged extension is discoverable by VS Code');
  await extension.activate();

  const target = vscode.Uri.file(require('node:path').resolve('tests/vscode/workspace/target.ts'));
  const document = await vscode.workspace.openTextDocument(target);
  const editor = await vscode.window.showTextDocument(document);
  const position = document.lineAt(0).range.end;
  await editor.edit((builder) => builder.insert(position, 'l'));

  const diagnostics = await until(
    () => vscode.languages.getDiagnostics(target),
    (items) => items.some((item) => item.source === 'Context Check'),
    'typing one character should produce a Context Check diagnostic'
  );
  const diagnostic = diagnostics.find((item) => item.source === 'Context Check');
  assert.match(diagnostic.message, /databse_url looks like existing database_url/);
  assert.equal(document.getText(diagnostic.range), 'databse_url');

  const actions = await codeActions(target, diagnostic.range);
  const replace = actions.find((action) => action.title === 'Use existing “database_url”');
  assert.ok(replace?.edit, 'Use existing Quick Fix is available');
  assert.equal(await vscode.workspace.applyEdit(replace.edit), true);
  assert.match(document.getText(), /database_url/);
  await vscode.commands.executeCommand('undo');
  assert.match(document.getText(), /databse_url/);

  const refreshed = await codeActions(target, diagnostic.range);
  const dismiss = refreshed.find((action) => action.title === 'Dismiss this comparison');
  assert.ok(dismiss?.command, 'exact-pair dismiss Quick Fix is available');
  await vscode.commands.executeCommand(dismiss.command.command, ...dismiss.command.arguments);
  await until(
    () => vscode.languages.getDiagnostics(target),
    (items) => !items.some((item) => item.code === 'databse_url→database_url'),
    'dismiss should remove only the selected comparison'
  );

  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  console.log(`${QUICK_FIX_CLAIM} passed: local typing, diagnostic, Quick Fix, native Undo, and exact-pair dismiss.`);
}

module.exports = { run };
