import { test, expect } from '@playwright/test';

test.describe('Admin Feedback Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Admin credentials not configured');

    // Sign in as admin
    await page.goto('/');
    await page.getByLabel('Open account menu').click();
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Navigate to admin panel > Feedback tab
    await page.getByLabel('Open account menu').click();
    const adminBtn = page.getByRole('button', { name: /Admin/i });
    await adminBtn.click();
    await page.getByRole('button', { name: 'Feedback' }).click();
  });

  test('mark feedback as reviewed', async ({ page }) => {
    // Wait for the feedback list to load
    await expect(page.locator('.admin__loading')).not.toBeVisible();

    // Expand the first feedback item
    const firstRow = page.locator('.admin__fb-row').first();
    test.skip(await firstRow.count() === 0, 'No feedback items available');

    await firstRow.locator('.admin__fb-row-header').click();

    // Click the "Reviewed" action button in the detail panel
    const reviewedBtn = firstRow.getByRole('button', { name: 'Reviewed' });
    if (await reviewedBtn.isVisible()) {
      await reviewedBtn.click();

      // Verify toast appears confirming the update
      await expect(page.locator('.admin__fb-toast--success')).toBeVisible();
    }
  });

  test('mark feedback as resolved', async ({ page }) => {
    await expect(page.locator('.admin__loading')).not.toBeVisible();

    const firstRow = page.locator('.admin__fb-row').first();
    test.skip(await firstRow.count() === 0, 'No feedback items available');

    await firstRow.locator('.admin__fb-row-header').click();

    // Click the "Resolved" action button (accent-styled)
    const resolvedBtn = firstRow.getByRole('button', { name: 'Resolved' });
    if (await resolvedBtn.isVisible()) {
      await resolvedBtn.click();

      // Verify success toast
      await expect(page.locator('.admin__fb-toast--success')).toBeVisible();
    }
  });

  test('mark feedback as dismissed', async ({ page }) => {
    await expect(page.locator('.admin__loading')).not.toBeVisible();

    const firstRow = page.locator('.admin__fb-row').first();
    test.skip(await firstRow.count() === 0, 'No feedback items available');

    await firstRow.locator('.admin__fb-row-header').click();

    // Click the "Dismissed" action button (warn-styled)
    const dismissedBtn = firstRow.getByRole('button', { name: 'Dismissed' });
    if (await dismissedBtn.isVisible()) {
      await dismissedBtn.click();

      // Verify success toast
      await expect(page.locator('.admin__fb-toast--success')).toBeVisible();
    }
  });

  test('filter by status', async ({ page }) => {
    await expect(page.locator('.admin__loading')).not.toBeVisible();

    // The status filter dropdown defaults to "new"
    const filterSelect = page.locator('.admin__select');
    await expect(filterSelect).toHaveValue('new');

    // Change filter to "All statuses"
    await filterSelect.selectOption('all');

    // Wait for reload
    await expect(page.locator('.admin__loading')).not.toBeVisible();

    // The list should now show items regardless of status (or empty message)
    const feedbackRows = page.locator('.admin__fb-row');
    const emptyMessage = page.locator('.admin__empty');
    const hasItems = await feedbackRows.count() > 0;
    const hasEmpty = await emptyMessage.isVisible();

    // One of these must be true — either items or an empty state
    expect(hasItems || hasEmpty).toBe(true);

    // Change filter to "resolved"
    await filterSelect.selectOption('resolved');
    await expect(page.locator('.admin__loading')).not.toBeVisible();

    // All visible badges should show "resolved" status (if any items)
    const badges = page.locator('.admin__fb-badge');
    const badgeCount = await badges.count();
    for (let i = 0; i < badgeCount; i++) {
      await expect(badges.nth(i)).toHaveText('resolved');
    }
  });
});
