import { createWriteStream } from 'node:fs';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import archiver from 'archiver';

const compiled = resolve('dist/vscode-extension');
const staging = resolve('dist/vscode-package');
const packageRoot = resolve(staging, 'extension');
const targetDirectory = resolve('site/public/downloads');
const target = resolve(targetDirectory, 'context-check-vscode.vsix');

await stat(resolve(compiled, 'vscode/extension.js'));
await rm(staging, { recursive: true, force: true });
await mkdir(packageRoot, { recursive: true });
await cp(resolve(compiled, 'vscode'), resolve(packageRoot, 'vscode'), { recursive: true });
await cp(resolve(compiled, 'src'), resolve(packageRoot, 'src'), { recursive: true });
await cp(resolve('vscode/package.json'), resolve(packageRoot, 'package.json'));
await mkdir(targetDirectory, { recursive: true });

const manifest = JSON.parse(await readFile(resolve('vscode/package.json'), 'utf8'));
const vsixManifest = `<?xml version="1.0" encoding="utf-8"?>\n<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">\n  <Metadata><Identity Id="${manifest.name}" Version="${manifest.version}" Publisher="${manifest.publisher}"/><DisplayName>${manifest.displayName}</DisplayName><Description xml:space="preserve">${manifest.description}</Description><Categories>Linters</Categories><GalleryFlags>Public</GalleryFlags></Metadata>\n  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation>\n  <Dependencies/><Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/><Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/></Assets>\n</PackageManifest>`;
await writeFile(resolve(staging, 'extension.vsixmanifest'), vsixManifest);
await writeFile(resolve(staging, '[Content_Types].xml'), '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="js" ContentType="application/javascript"/><Default Extension="md" ContentType="text/markdown"/><Default Extension="xml" ContentType="application/xml"/></Types>');
await writeFile(resolve(packageRoot, 'README.md'), '# Context Check\n\nLocal, explainable checks for newly introduced near-match tokens using workspace vocabulary. Source stays on this device.');

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(target);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolvePromise);
  output.on('error', reject);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(staging, false);
  void archive.finalize();
});

console.log(`Packaged ${target}`);
