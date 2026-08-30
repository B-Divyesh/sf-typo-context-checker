import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = [
  'dist/site/index.html',
  'dist/site/privacy/index.html',
  'dist/site/terms/index.html',
  'dist/site/demo/index.html',
  'dist/site/404.html',
  'dist/site/assets/context-check-og.jpg',
  'dist/site/assets/apple-touch-icon.png',
  'dist/site/downloads/context-check-chrome.zip',
  'dist/site/downloads/context-check-vscode.vsix',
  'dist/site/staticwebapp.config.json',
  'dist/vscode-extension/vscode/extension.js',
  'dist/chrome-mv3/manifest.json'
];

await Promise.all(required.map((path) => access(resolve(path))));
const html = await readFile(resolve('dist/site/index.html'), 'utf8');
if (!html.includes('<main id="main">') || !html.includes('<html lang="en">')) {
  throw new Error('Built landing page is missing required semantic structure.');
}
const scripts = await Promise.all(
  [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(async ([, source]) => stat(resolve('dist/site', source.replace(/^\//, ''))))
);
const scriptBytes = scripts.reduce((total, file) => total + file.size, 0);
if (scriptBytes > 200 * 1024) throw new Error(`Initial JS is ${scriptBytes} bytes; budget is 204800.`);
const deployConfig = JSON.parse(await readFile(resolve('dist/site/staticwebapp.config.json'), 'utf8'));
if (deployConfig.globalHeaders?.['Referrer-Policy'] !== 'no-referrer' || !deployConfig.globalHeaders?.['Permissions-Policy']) {
  throw new Error('Static deployment response policy is incomplete.');
}
const immutableRule = deployConfig.routes?.find((route) => route.route === '/assets/*');
if (immutableRule?.headers?.['Cache-Control'] !== 'public, max-age=31536000, immutable') {
  throw new Error('Hashed main assets are not configured for immutable caching.');
}
if (deployConfig.responseOverrides?.['404']?.rewrite !== '/404.html') {
  throw new Error('Static deployment does not use the product 404 page.');
}
const claims = JSON.parse(await readFile(resolve('.factory/claims.json'), 'utf8'));
const testSources = await Promise.all([
  readFile(resolve('tests/checker.test.ts'), 'utf8'),
  readFile(resolve('tests/e2e/site.spec.ts'), 'utf8'),
  readFile(resolve('tests/vscode/suite.cjs'), 'utf8'),
  readFile(resolve('scripts/test-extension.mjs'), 'utf8')
]);
for (const { id } of claims) {
  const count = testSources.join('\n').split(`@claim:${id}`).length - 1;
  if (count !== 1) throw new Error(`Claim ${id} must have exactly one tagged test; found ${count}.`);
}
console.log(`Verified static deploy and extension package. Initial JS: ${scriptBytes} bytes.`);
