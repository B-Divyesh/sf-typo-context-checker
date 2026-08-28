import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = [
  'dist/site/index.html',
  'dist/site/privacy/index.html',
  'dist/site/terms/index.html',
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
const immutableRule = deployConfig.routes?.find((route) => route.route === '/assets/main-*');
if (immutableRule?.headers?.['Cache-Control'] !== 'public, max-age=31536000, immutable') {
  throw new Error('Hashed main assets are not configured for immutable caching.');
}
console.log(`Verified static deploy and extension package. Initial JS: ${scriptBytes} bytes.`);
