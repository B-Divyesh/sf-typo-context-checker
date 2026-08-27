import { checkContext } from '../../src/core/checker';
import { dismissPair, getSettings, restorePair, saveSettings } from '../../src/core/storage';
import type { Finding } from '../../src/core/types';
import './style.css';

const form = document.querySelector<HTMLFormElement>('#check-form')!;
const existingInput = document.querySelector<HTMLTextAreaElement>('#existing-text')!;
const changedInput = document.querySelector<HTMLTextAreaElement>('#changed-text')!;
const results = document.querySelector<HTMLElement>('#results')!;
const undoRegion = document.querySelector<HTMLElement>('#undo-region')!;
const settingsForm = document.querySelector<HTMLFormElement>('#settings-form')!;
const enabledInput = document.querySelector<HTMLInputElement>('#enabled')!;
const disabledPathsInput = document.querySelector<HTMLTextAreaElement>('#disabled-paths')!;
const settingsStatus = document.querySelector<HTMLElement>('#settings-status')!;

let currentFindings: Finding[] = [];

function element<K extends keyof HTMLElementTagNameMap>(name: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(name);
  if (className) node.className = className;
  return node;
}

function renderResults(findings: Finding[]): void {
  currentFindings = findings;
  results.replaceChildren();
  if (!findings.length) {
    const state = element('p', 'empty-state safe-state');
    const strong = element('strong');
    strong.textContent = 'No close matches found.';
    state.append(strong, document.createElement('br'), 'That means no new token looks unusually close to the supplied project words.');
    results.append(state);
    return;
  }

  const summary = element('p', 'result-summary');
  summary.textContent = `${findings.length} possible ${findings.length === 1 ? 'confusion' : 'confusions'} to review`;
  const list = element('ol', 'finding-list');
  findings.forEach((finding, index) => {
    const item = element('li', 'finding');
    const meta = element('p', 'finding-meta');
    meta.textContent = `${finding.kind} · changed line ${finding.line}`;
    const comparison = element('p', 'comparison');
    const introduced = element('code');
    introduced.textContent = finding.introduced;
    const arrow = element('span');
    arrow.setAttribute('aria-label', 'looks like');
    arrow.textContent = '→';
    const existing = element('code');
    existing.textContent = finding.existing;
    comparison.append(introduced, arrow, existing);
    const explanation = element('p', 'explanation');
    explanation.textContent = finding.explanation;
    const actions = element('div', 'finding-actions');
    const useButton = element('button');
    useButton.type = 'button';
    useButton.textContent = `Use “${finding.existing}”`;
    useButton.addEventListener('click', () => {
      changedInput.value = changedInput.value.split(finding.introduced).join(finding.existing);
      const next = checkContext(existingInput.value, changedInput.value);
      renderResults(next);
      changedInput.focus();
    });
    const dismissButton = element('button', 'text-button');
    dismissButton.type = 'button';
    dismissButton.textContent = 'Dismiss this pair';
    dismissButton.addEventListener('click', async () => {
      await dismissPair(finding.pairKey);
      renderResults(currentFindings.filter((_, findingIndex) => findingIndex !== index));
      const notice = element('p');
      notice.append('Pair dismissed. ');
      const undo = element('button', 'undo-button');
      undo.type = 'button';
      undo.textContent = 'Undo';
      undo.addEventListener('click', async () => {
        await restorePair(finding.pairKey);
        renderResults(checkContext(existingInput.value, changedInput.value));
        undoRegion.replaceChildren();
      });
      notice.append(undo);
      undoRegion.replaceChildren(notice);
    });
    actions.append(useButton, dismissButton);
    item.append(meta, comparison, explanation, actions);
    list.append(item);
  });
  results.append(summary, list);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!existingInput.value.trim() || !changedInput.value.trim()) {
    results.innerHTML = '<p class="empty-state error-state"><strong>Both text areas are needed.</strong><br>Paste trusted project words and the changed text, then check again.</p>';
    (!existingInput.value.trim() ? existingInput : changedInput).focus();
    return;
  }
  const settings = await getSettings();
  renderResults(checkContext(existingInput.value, changedInput.value, { dismissedPairs: settings.dismissedPairs }));
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    form.requestSubmit();
  }
});

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const current = await getSettings();
  await saveSettings({
    ...current,
    enabled: enabledInput.checked,
    disabledPaths: disabledPathsInput.value.split('\n').map((line) => line.trim()).filter(Boolean)
  });
  settingsStatus.textContent = 'Settings saved on this device.';
});

document.querySelector<HTMLButtonElement>('#clear-dismissed')!.addEventListener('click', async () => {
  const current = await getSettings();
  await saveSettings({ ...current, dismissedPairs: [] });
  settingsStatus.textContent = 'Dismissed pairs restored.';
});

async function init(): Promise<void> {
  const settings = await getSettings();
  enabledInput.checked = settings.enabled;
  disabledPathsInput.value = settings.disabledPaths.join('\n');
  const { pageState } = await chrome.storage.local.get('pageState');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageHeading = document.querySelector<HTMLElement>('#page-heading')!;
  const pageDetail = document.querySelector<HTMLElement>('#page-detail')!;
  if (tab?.url?.startsWith('https://github.com/') && pageState?.url === tab.url) {
    const count = Array.isArray(pageState.findings) ? pageState.findings.length : 0;
    pageHeading.textContent = count ? `${count} possible ${count === 1 ? 'confusion' : 'confusions'}` : 'No close matches found';
    pageDetail.textContent = count ? 'Review the proof notes beside added lines on GitHub.' : 'This diff was checked locally against its surrounding tokens.';
  }
  document.querySelector('#connection-status')!.textContent = navigator.onLine ? 'Local-only' : 'Offline · still works';
}

void init();
