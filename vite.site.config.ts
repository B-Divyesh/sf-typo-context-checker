import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site',
  build: {
    outDir: '../dist/site',
    emptyOutDir: false,
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'site/index.html'),
        privacy: resolve(import.meta.dirname, 'site/privacy/index.html'),
        terms: resolve(import.meta.dirname, 'site/terms/index.html')
      }
    }
  }
});
