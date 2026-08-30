import { resolve } from 'node:path';
import { runTests } from '@vscode/test-electron';

await runTests({
  extensionDevelopmentPath: resolve('dist/vscode-package/extension'),
  extensionTestsPath: resolve('tests/vscode/suite.cjs'),
  launchArgs: [resolve('tests/vscode/workspace'), '--disable-extensions']
});
