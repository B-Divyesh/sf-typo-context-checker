import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = [
  'dist/site/index.html',
  'dist/site/privacy/index.html',
  'dist/site/terms/index.html',
  'dist/site/downloads/context-check-chrome.zip',
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
console.log(`Verified static deploy and extension package. Initial JS: ${scriptBytes} bytes.`);
