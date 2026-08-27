import { checkContext, pathIsDisabled } from '../src/core/checker';
import { dismissPair, getSettings, savePageFindings } from '../src/core/storage';
import type { Finding } from '../src/core/types';
import './content/style.css';

interface FileCheck {
  path: string;
  findings: Finding[];
  additions: HTMLElement[];
}

function getFilePath(container: Element): string {
  return (
    container.getAttribute('data-path') ||
    container.querySelector<HTMLElement>('[data-path]')?.dataset.path ||
    container.querySelector<HTMLElement>('.file-info a, [data-testid="file-header"] a')?.textContent?.trim() ||
    'unknown-file'
  );
}

function visibleLineText(element: Element): string {
  return [...element.childNodes]
    .filter((node) => !(node instanceof HTMLElement && node.classList.contains('context-check-note')))
    .map((node) => node.textContent ?? '')
    .join('');
}

function collectFile(container: Element, disabledPaths: string[], dismissedPairs: string[]): FileCheck | null {
  const path = getFilePath(container);
  if (pathIsDisabled(path, disabledPaths)) return null;
  const additions = [...container.querySelectorAll<HTMLElement>('.blob-code-addition, [data-code-marker="+"]')]
    .filter((line) => !line.closest('.js-expandable-line'));
  if (!additions.length) return null;
  const contextualLines = [...container.querySelectorAll<HTMLElement>(
    '.blob-code-context, .blob-code-deletion, [data-code-marker=" "], [data-code-marker="-"]'
  )];
  const existing = [path, ...contextualLines.map(visibleLineText)].join('\n');
  const changed = additions.map(visibleLineText).join('\n');
  return { path, findings: checkContext(existing, changed, { dismissedPairs }), additions };
}

function makeNote(finding: Finding, onDismiss: () => void): HTMLElement {
  const note = document.createElement('span');
  note.className = 'context-check-note';
  note.setAttribute('role', 'note');
  note.tabIndex = 0;

  const flag = document.createElement('span');
  flag.className = 'context-check-flag';
  flag.textContent = 'Context Check';
  const comparison = document.createElement('span');
  comparison.className = 'context-check-comparison';
  comparison.textContent = `${finding.introduced} → ${finding.existing}`;
  const explanation = document.createElement('span');
  explanation.className = 'context-check-explanation';
  explanation.textContent = finding.explanation;
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = 'Dismiss this pair';
  dismiss.addEventListener('click', async (event) => {
    event.stopPropagation();
    await dismissPair(finding.pairKey);
    note.remove();
    onDismiss();
  });
  note.append(flag, comparison, explanation, dismiss);
  return note;
}

function ensureSummary(count: number): void {
  document.querySelector('.context-check-summary')?.remove();
  if (!count) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'context-check-summary';
  button.textContent = `${count} possible ${count === 1 ? 'confusion' : 'confusions'}`;
  button.setAttribute('aria-label', `${count} possible contextual token ${count === 1 ? 'confusion' : 'confusions'}; jump to first`);
  button.addEventListener('click', () => {
    const first = document.querySelector<HTMLElement>('.context-check-note');
    first?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    first?.focus({ preventScroll: true });
  });
  document.body.append(button);
}

async function scan(): Promise<void> {
  const settings = await getSettings();
  document.querySelectorAll('.context-check-note, .context-check-summary').forEach((node) => node.remove());
  if (!settings.enabled) {
    await chrome.runtime.sendMessage({ type: 'CONTEXT_CHECK_COUNT', count: 0 });
    return;
  }

  const containers = [...document.querySelectorAll('.file, [data-testid="diff-file"]')];
  const allFindings: Finding[] = [];
  for (const container of containers) {
    const result = collectFile(container, settings.disabledPaths, settings.dismissedPairs);
    if (!result) continue;
    for (const finding of result.findings) {
      const target = result.additions[finding.line - 1];
      if (!target) continue;
      target.append(makeNote(finding, () => void scan()));
      allFindings.push(finding);
    }
  }
  ensureSummary(allFindings.length);
  await savePageFindings(location.href, allFindings);
  await chrome.runtime.sendMessage({ type: 'CONTEXT_CHECK_COUNT', count: allFindings.length });
}

export default defineContentScript({
  matches: ['https://github.com/*/*/pull/*', 'https://github.com/*/*/commit/*', 'https://github.com/*/*/compare/*'],
  runAt: 'document_idle',
  main() {
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void scan(), 450);
    };
    schedule();
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => {
        if (!(node instanceof Element)) return false;
        return !node.matches('.context-check-note, .context-check-summary') && !node.closest('.context-check-note, .context-check-summary');
      }))) {
        schedule();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled || changes.disabledPaths || changes.dismissedPairs) schedule();
    });
  }
});
