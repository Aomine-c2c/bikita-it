import { test, expect } from '@playwright/test';

test.describe('Security Boundaries', () => {
  // Clear any existing auth state before tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Unauthenticated user is redirected when accessing settings', async ({ page }) => {
    await page.goto('/settings');
    // It should either render a login form or redirect to /login
    // Pulse handles this in middleware or client guards
    await expect(page.getByRole('heading', { name: 'Sign in to Pulse' })).toBeVisible({ timeout: 5000 });
  });

  test('Unauthenticated user is redirected when accessing reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Sign in to Pulse' })).toBeVisible({ timeout: 5000 });
  });

  test('Unauthenticated user cannot access API directly', async ({ request }) => {
    // If the frontend makes an API call to a protected route without token, it should fail
    // We mock the fetch or expect the API to return 401 if it's running
    const response = await request.get('/api/v1/settings', {
      headers: {
        'Accept': 'application/json'
      }
    });
    // In a Tauri desktop app exported statically, Next.js API routes don't exist, 
    // it bridges via tauri IPC. But if we test the web fallback, we expect 401 or 404.
    expect([401, 404]).toContain(response.status());
  });
});
