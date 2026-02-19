import { test, expect } from '@playwright/test';

test.describe('Admin Posts Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Admin credentials not configured');

    // Sign in as admin
    await page.goto('/');
    await page.getByLabel('Open account menu').click();
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Navigate to admin panel > Posts tab
    await page.getByLabel('Open account menu').click();
    const adminBtn = page.getByRole('button', { name: /Admin/i });
    await adminBtn.click();
    await page.getByRole('button', { name: 'Posts' }).click();
  });

  test('create new post appears in list', async ({ page }) => {
    // Click "+ New Post" button
    await page.getByRole('button', { name: /New Post/i }).click();

    // Fill form fields
    const testTitle = `E2E Test Post ${Date.now()}`;
    await page.locator('.admin__form input[type="text"]').first().fill(testTitle);
    await page.locator('.admin__form textarea').fill('Automated test post description.');
    await page.locator('.admin__emoji-input').fill('🧪');

    // Select a category
    await page.getByRole('button', { name: 'announcement' }).click();

    // Save the draft
    await page.getByRole('button', { name: /Create Draft/i }).click();

    // Verify post appears in the list
    await expect(page.locator('.admin__post-title', { hasText: testTitle })).toBeVisible();

    // Verify it has the Draft badge
    const postRow = page.locator('.admin__post-row', { hasText: testTitle });
    await expect(postRow.locator('.admin__draft-badge')).toBeVisible();
  });

  test('publish draft post changes status', async ({ page }) => {
    // Find a draft post (has a Publish button visible)
    const draftRow = page.locator('.admin__post-row').filter({
      has: page.locator('.admin__draft-badge'),
    }).first();

    // Click Publish
    await draftRow.getByRole('button', { name: 'Publish' }).click();

    // Wait for status to change — the row should now show a "Published" date
    // and the Publish button should be replaced by Unpublish
    await expect(draftRow.getByRole('button', { name: 'Unpublish' })).toBeVisible();
    await expect(draftRow.locator('.admin__post-date')).toBeVisible();
  });

  test('unpublish post reverts status', async ({ page }) => {
    // Find a published post (has an Unpublish button)
    const publishedRow = page.locator('.admin__post-row').filter({
      has: page.locator('.admin__action-btn--warn'),
    }).first();

    // Click Unpublish
    await publishedRow.getByRole('button', { name: 'Unpublish' }).click();

    // Verify it reverts to draft
    await expect(publishedRow.locator('.admin__draft-badge')).toBeVisible();
    await expect(publishedRow.getByRole('button', { name: 'Publish' })).toBeVisible();
  });

  test('delete post removes from list', async ({ page }) => {
    // Count posts before deletion
    const countBefore = await page.locator('.admin__post-row').count();
    test.skip(countBefore === 0, 'No posts available to delete');

    // Get the title of the first post for verification
    const firstRow = page.locator('.admin__post-row').first();
    const titleText = await firstRow.locator('.admin__post-title').textContent();

    // Click Delete on the first post
    await firstRow.getByRole('button', { name: 'Delete' }).click();

    // Wait for the list to update — count should decrease
    await expect(page.locator('.admin__post-row')).toHaveCount(countBefore - 1);

    // If there are remaining posts, the deleted title should not be first
    if (countBefore > 1) {
      const newFirstTitle = await page.locator('.admin__post-row').first().locator('.admin__post-title').textContent();
      expect(newFirstTitle).not.toBe(titleText);
    }
  });
});
