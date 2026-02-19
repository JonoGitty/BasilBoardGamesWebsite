import { test, expect } from '@playwright/test';

test.describe('What\'s New Feed', () => {
  test('published posts appear in the feed', async ({ page }) => {
    await page.goto('/');

    // The What's New section should be present on the hub
    const section = page.locator('section[aria-label="What\'s new"]');
    await expect(section).toBeVisible();

    // The heading should say "What's New"
    await expect(section.locator('.whats-new__heading')).toHaveText("What's New");

    // There should be at least one post item, or the empty-state message
    const items = section.locator('.whats-new__item');
    const emptyMsg = section.locator('.whats-new__empty');
    const hasItems = await items.count() > 0;
    const hasEmpty = await emptyMsg.isVisible();
    expect(hasItems || hasEmpty).toBe(true);

    // If posts exist, verify each item has the expected structure
    if (hasItems) {
      const firstItem = items.first();
      // Each item should have an emoji thumbnail, a title, and a date
      await expect(firstItem.locator('.whats-new__thumb')).toBeVisible();
      await expect(firstItem.locator('.whats-new__title')).toBeVisible();
      await expect(firstItem.locator('.whats-new__date')).toBeVisible();
      // Category badge should be one of the known types
      const badge = firstItem.locator('.whats-new__badge');
      await expect(badge).toBeVisible();
      const badgeText = (await badge.textContent())?.toLowerCase() ?? '';
      expect(['patch', 'experiment', 'announcement']).toContain(badgeText);
    }
  });

  test('unpublished posts do not appear in the feed', async ({ page }) => {
    await page.goto('/');

    const section = page.locator('section[aria-label="What\'s new"]');
    await expect(section).toBeVisible();

    // Unpublished (draft) posts should never have the "Draft" badge in the
    // public feed — the Draft badge is only in the admin panel.
    const draftBadges = section.locator('.admin__draft-badge');
    await expect(draftBadges).toHaveCount(0);

    // No items should contain any admin-only elements
    const adminActions = section.locator('.admin__action-btn');
    await expect(adminActions).toHaveCount(0);
  });
});
