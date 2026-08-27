import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist',
  srcDir: '.',
  entrypointsDir: 'entrypoints',
  manifest: {
    name: 'Context Check',
    short_name: 'Context Check',
    description: 'Catch near-match identifiers and keys in GitHub pull requests. Source stays on your device.',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://github.com/*'],
    action: { default_title: 'Open Context Check' },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    },
    commands: {
      '_execute_action': {
        suggested_key: { default: 'Alt+Shift+C', mac: 'MacCtrl+Shift+C' }
      }
    }
  }
});
