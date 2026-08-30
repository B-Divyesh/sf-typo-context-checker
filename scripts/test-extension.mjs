import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const extensionPath = resolve('dist/chrome-mv3');
const profile = await mkdtemp(join(tmpdir(), 'context-check-extension-'));
const context = await chromium.launchPersistentContext(profile, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const popup = await context.newPage();
  const errors = [];
  popup.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  popup.on('pageerror', (error) => errors.push(error.message));
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await popup.getByLabel('Existing project words').fill('database_url\npaymentRetryCount');
  await popup.getByLabel('New or changed text').fill('databse_url = databse_url');
  await popup.getByRole('button', { name: 'Check in context' }).click();
  await popup.locator('.comparison').waitFor();
  assert.match(await popup.locator('.comparison').innerText(), /databse_url\s*→\s*database_url/);

  await popup.getByRole('button', { name: 'Use “database_url”' }).click();
  assert.equal(await popup.getByLabel('New or changed text').inputValue(), 'database_url = databse_url', 'Use existing replaces only the first occurrence');
  await popup.getByRole('button', { name: 'Undo', exact: true }).click();
  assert.equal(await popup.getByLabel('New or changed text').inputValue(), 'databse_url = databse_url', 'Undo restores the exact original text');
  await popup.locator('.comparison').waitFor();

  await popup.getByRole('button', { name: 'Dismiss this pair' }).click();
  await popup.getByText('Pair dismissed.').waitFor();
  await popup.getByRole('button', { name: 'Undo', exact: true }).click();
  await popup.locator('.comparison').waitFor();

  const axe = await new AxeBuilder({ page: popup }).analyze();
  assert.deepEqual(axe.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'), []);
  assert.deepEqual(errors, [], 'popup should not log console or page errors');

  const github = await context.newPage();
  const githubErrors = [];
  github.on('console', (message) => { if (message.type() === 'error') githubErrors.push(message.text()); });
  github.on('pageerror', (error) => githubErrors.push(error.message));
  await github.route('https://github.com/example/project/pull/1', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="en"><body>
      <main><div class="file" data-path="src/config.ts">
        <div class="blob-code-context">const database_url = value;</div>
        <div class="blob-code-addition">const databse_url = value;</div>
      </div></main>
    </body></html>`
  }));
  await github.goto('https://github.com/example/project/pull/1');
  await github.getByRole('note').waitFor({ timeout: 5_000 });
  assert.match(await github.getByRole('note').innerText(), /databse_url → database_url/);
  assert.equal(await github.locator('.context-check-summary').innerText(), '1 possible confusion');
  assert.deepEqual(githubErrors, [], 'content script should not log console or page errors');

  console.log('Extension integration passed: popup replace/undo/dismiss, axe, and GitHub content script.');
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
