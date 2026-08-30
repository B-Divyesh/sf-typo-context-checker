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
  await expect(page.getByRole('heading', { name: /Catch the typo/ })).toBeVisible();
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
  for (const name of ['Context Check, home', 'Try a local check', 'Privacy', 'Terms', 'Source']) {
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
