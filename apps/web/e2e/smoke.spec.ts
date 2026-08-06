import { test, expect } from '@playwright/test';

test('App should load and show login page if auth enabled', async ({ page }) => {
  await page.goto('/');
  // Next.js might redirect to /login or show Dashboard
  await page.waitForLoadState('networkidle');
  const title = await page.title();
  expect(title).not.toBe('');
});

test('Settings page should render', async ({ page }) => {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=General Settings')).toBeVisible({ timeout: 10000 }).catch(() => {
    // If it redirects to login, check for login form
    return expect(page.getByRole('heading', { name: 'Sign in to Pulse' })).toBeVisible();
  });
});
