import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing page has a working local checker', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Context Check/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Find near-match code typos/ })).toBeVisible();
  await expect(page.getByText('For software engineers and reviewers who need help spotting plausible code-token mistakes before review.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByText('2 possible confusions')).toBeVisible();

  await page.getByLabel('New change').fill('database_url = value');
  await page.getByRole('button', { name: 'Check these lines' }).click();
  await expect(page.getByRole('heading', { name: 'No close matches found' })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('landing page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('390px navigation and footer links retain 44px touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const name of ['Context Check, home', 'Try it with sample data', 'Privacy', 'Terms', 'Source on GitHub']) {
    const box = await page.getByRole('link', { name, exact: true }).boundingBox();
    expect(box, `${name} should be visible`).not.toBeNull();
    expect(box!.height, `${name} should be at least 44px high`).toBeGreaterThanOrEqual(44);
  }
});

test('legal pages retain semantic essentials', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('@claim:demo-local-match sample data produces explained near-match findings', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Context Check');
  await expect(page.getByText('2 possible confusions')).toBeVisible();
  await expect(page.getByText(/is 1 character shorter/)).toBeVisible();
  await page.getByLabel('New change').fill('database_url = value');
  await page.getByRole('button', { name: 'Check these lines' }).click();
  await expect(page.getByRole('heading', { name: 'No close matches found' })).toBeVisible();
});

test('@claim:site-local-only checker sends no text to another origin', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });
  await page.goto('/demo/');
  await page.getByLabel('New change').fill('const databse_url = value;');
  await page.getByRole('button', { name: 'Check these lines' }).click();
  await expect(page.getByText('1 possible confusion')).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('@claim:demo-ephemeral sample checker stores no browser data', async ({ page, context }) => {
  await page.goto('/demo/');
  await page.getByLabel('New change').fill('const databse_url = value;');
  await page.getByRole('button', { name: 'Check these lines' }).click();
  await expect(page.getByText('1 possible confusion')).toBeVisible();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(await context.cookies()).toEqual([]);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/demo/');
  expect(await reopened.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test('static site does not register a service worker or imply offline updates', async ({ page }) => {
  await page.goto('/');
  const registrations = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return [];
    return (await navigator.serviceWorker.getRegistrations()).map((registration) => registration.scope);
  });
  expect(registrations).toEqual([]);
});

test('keyboard, reduced motion, and mobile layout remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByLabel('New change').focus();
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('2 possible confusions')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const animationDuration = await page.locator('.proof-card').first().evaluate((node) => getComputedStyle(node).animationDuration);
  expect(['0s', '0.00001s', '1e-05s']).toContain(animationDuration);
});

test('all mobile interactive targets are at least 44 by 44 pixels on every route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(path);
    const controls = page.locator('a, button, summary, textarea, input, select');
    for (let index = 0; index < await controls.count(); index++) {
      const control = controls.nth(index);
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      expect(box, `${path} control ${index} should have a box`).not.toBeNull();
      expect(box!.width, `${path} control ${index} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${path} control ${index} should be at least 44px high`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('demo and not-found routes retain semantic essentials', async ({ page }) => {
  for (const path of ['/demo/', '/404.html']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});
