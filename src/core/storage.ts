import type { Finding } from './types';

export interface Settings {
  enabled: boolean;
  disabledPaths: string[];
  dismissedPairs: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  disabledPaths: ['.env*', '**/secrets/**', '**/*.pem'],
  dismissedPairs: []
};

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {
    enabled: result.enabled !== false,
    disabledPaths: Array.isArray(result.disabledPaths) ? result.disabledPaths : DEFAULT_SETTINGS.disabledPaths,
    dismissedPairs: Array.isArray(result.dismissedPairs) ? result.dismissedPairs : []
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set(settings);
}

export async function dismissPair(pairKey: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.dismissedPairs.includes(pairKey)) {
    await chrome.storage.local.set({ dismissedPairs: [...settings.dismissedPairs, pairKey] });
  }
}

export async function restorePair(pairKey: string): Promise<void> {
  const settings = await getSettings();
  await chrome.storage.local.set({ dismissedPairs: settings.dismissedPairs.filter((item) => item !== pairKey) });
}

export async function savePageFindings(url: string, findings: Finding[]): Promise<void> {
  await chrome.storage.local.set({ pageState: { url, findings, checkedAt: Date.now() } });
}
