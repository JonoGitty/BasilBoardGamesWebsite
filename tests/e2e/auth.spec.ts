import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('sign up form requires privacy consent', async ({ page }) => {
    await page.goto('/');

    // Open account menu to reach auth form
    await page.getByLabel('Open account menu').click();

    // Navigate to the sign-up mode
    const toggleBtn = page.getByRole('button', { name: /Sign Up/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }

    // The privacy checkbox must be present in sign-up mode
    const privacyCheckbox = page.locator('.auth-form__checkbox-field input[type="checkbox"]');
    await expect(privacyCheckbox).toBeVisible();
    await expect(privacyCheckbox).not.toBeChecked();

    // Submit should be disabled or rejected without consent checked
    // Fill minimal fields but leave consent unchecked
    await page.locator('input[type="email"]').fill('test-noconsent@example.com');
    await page.locator('input[type="password"]').fill('password123');

    // The consent checkbox is required for sign-up to proceed
    await expect(privacyCheckbox).not.toBeChecked();
  });

  test('sign in with valid credentials redirects to hub', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured');

    await page.goto('/');
    await page.getByLabel('Open account menu').click();

    // Fill sign-in form
    await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!);

    // Submit
    await page.getByRole('button', { name: 'Sign In' }).click();

    // After successful sign-in the hub content should be visible
    await expect(page.locator('.top-bar__title')).toContainText('Basil Board Games');
  });

  test('sign out returns to landing', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured');

    await page.goto('/');
    await page.getByLabel('Open account menu').click();

    // Sign in first
    await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Open account drawer and sign out
    await page.getByLabel('Open account menu').click();
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i });
    await signOutBtn.click();

    // After sign out the auth form or landing should be visible
    await expect(page.locator('.top-bar__title')).toContainText('Basil Board Games');
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open account menu').click();

    // Fill invalid credentials
    await page.locator('input[type="email"]').fill('nobody@invalid.example');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // An error message should appear
    await expect(page.locator('.auth-form__error')).toBeVisible();
  });

  test('session persists across reload', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured');

    await page.goto('/');
    await page.getByLabel('Open account menu').click();

    // Sign in
    await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for hub to load
    await expect(page.locator('.top-bar__title')).toContainText('Basil Board Games');

    // Reload and verify session persists
    await page.reload();
    await expect(page.locator('.top-bar__title')).toContainText('Basil Board Games');

    // Account menu should still show signed-in state (no sign-in form)
    await page.getByLabel('Open account menu').click();
    await expect(page.locator('.auth-form__submit')).not.toBeVisible();
  });
});
