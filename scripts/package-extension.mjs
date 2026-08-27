import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import archiver from 'archiver';

const source = resolve('dist/chrome-mv3');
const targetDirectory = resolve('site/public/downloads');
const target = resolve(targetDirectory, 'context-check-chrome.zip');

await stat(resolve(source, 'manifest.json'));
await mkdir(targetDirectory, { recursive: true });

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(target);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolvePromise);
  output.on('error', reject);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(source, false);
  void archive.finalize();
});

console.log(`Packaged ${target}`);
