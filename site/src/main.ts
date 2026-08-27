import { checkContext } from '../../src/core/checker';
import type { Finding } from '../../src/core/types';
import './style.css';

const form = document.querySelector<HTMLFormElement>('#demo-form');
const known = document.querySelector<HTMLTextAreaElement>('#known-text');
const changed = document.querySelector<HTMLTextAreaElement>('#new-text');
const results = document.querySelector<HTMLElement>('#demo-results');

function makeElement<K extends keyof HTMLElementTagNameMap>(name: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(name);
  if (className) node.className = className;
  return node;
}

function renderFinding(finding: Finding): HTMLElement {
  const article = makeElement('article', 'proof-card');
  const meta = makeElement('p', 'proof-meta');
  meta.textContent = `${finding.kind} · line ${finding.line}`;
  const comparison = makeElement('p', 'proof-comparison');
  const introduced = makeElement('code');
  introduced.textContent = finding.introduced;
  const connector = makeElement('span');
  connector.textContent = 'looks like';
  const existing = makeElement('code');
  existing.textContent = finding.existing;
  comparison.append(introduced, connector, existing);
  const explanation = makeElement('p');
  explanation.textContent = finding.explanation;
  const decision = makeElement('p', 'proof-decision');
  decision.textContent = 'Review before merge';
  article.append(meta, comparison, explanation, decision);
  return article;
}

function runDemo(): void {
  if (!known || !changed || !results) return;
  results.replaceChildren();
  if (!known.value.trim() || !changed.value.trim()) {
    const message = makeElement('p', 'demo-message error-message');
    message.textContent = 'Add both existing project words and changed text to make a comparison.';
    results.append(message);
    return;
  }
  const findings = checkContext(known.value, changed.value);
  const heading = makeElement('h3');
  heading.textContent = findings.length ? `${findings.length} possible ${findings.length === 1 ? 'confusion' : 'confusions'}` : 'No close matches found';
  results.append(heading);
  if (!findings.length) {
    const message = makeElement('p', 'demo-message safe-message');
    message.textContent = 'The new tokens do not closely resemble the supplied project vocabulary.';
    results.append(message);
    return;
  }
  const grid = makeElement('div', 'proof-grid');
  findings.forEach((finding) => grid.append(renderFinding(finding)));
  results.append(grid);
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  runDemo();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && document.activeElement?.closest('#demo-form')) {
    event.preventDefault();
    runDemo();
  }
});

runDemo();
