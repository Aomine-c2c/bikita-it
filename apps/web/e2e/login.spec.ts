import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('http://localhost:3000/login');
    
    // Check if the title is correct
    await expect(page).toHaveTitle(/Xiphos/i);
    
    // Check if the login form elements are present
    await expect(page.locator('h1')).toContainText('Sign in to Xiphos');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error on empty submit', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Note: since the inputs have the "required" attribute, the browser itself
    // will block the submit. If we wanted to test our API error handling,
    // we would need to mock the API or bypass the browser validation.
    
    // Instead, let's fill with incorrect credentials to test API error handling
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'invalidpassword');
    
    // In a real environment without the API running, this will fail to fetch
    // or return a 401. The UI should display the error message.
    await page.click('button[type="submit"]');
    
    // Wait for the error message to appear in the UI
    const errorMsg = page.locator('.text-red-600');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });
});
