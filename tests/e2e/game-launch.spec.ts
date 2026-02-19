import { test, expect } from '@playwright/test';

test.describe('Game Launch', () => {
  test('click game card launches game', async ({ page }) => {
    await page.goto('/');

    // Dismiss consent banner if visible, so it does not obscure game cards
    const acceptBtn = page.locator('.consent-banner__btn--accept');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }

    // The launcher section should contain game cards
    // Both classic (card-fan) and themed launchers use aria-label="Play <title>"
    const gameButtons = page.getByRole('button', { name: /^Play /i });
    const gameCount = await gameButtons.count();
    expect(gameCount).toBeGreaterThan(0);

    // Click the first available game card
    const firstGame = gameButtons.first();
    const gameName = await firstGame.getAttribute('aria-label');
    await firstGame.click();

    // After launch, the game-launch view should appear with the game title
    const launchTitle = page.locator('.game-launch__title');
    await expect(launchTitle).toBeVisible();

    // The title text should match the game we clicked
    if (gameName) {
      const expectedTitle = gameName.replace(/^Play\s+/i, '');
      await expect(launchTitle).toHaveText(expectedTitle);
    }
  });

  test('game page loads without error', async ({ page }) => {
    await page.goto('/');

    // Dismiss consent banner if visible
    const acceptBtn = page.locator('.consent-banner__btn--accept');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }

    // Launch first available game
    const gameButton = page.getByRole('button', { name: /^Play /i }).first();
    await gameButton.click();

    // Verify the game launch frame is present and has content
    const launchFrame = page.locator('.game-launch');
    await expect(launchFrame).toBeVisible();

    // There should be no error messages visible
    const errorElements = page.locator('.admin__error, .auth-form__error, [role="alert"]');
    await expect(errorElements).toHaveCount(0);

    // The game description and End Session button should be present
    await expect(page.locator('.game-launch__desc')).toBeVisible();
    await expect(page.getByRole('button', { name: /End Session/i })).toBeVisible();
  });

  test('back to hub returns to main page', async ({ page }) => {
    await page.goto('/');

    // Dismiss consent banner if visible
    const acceptBtn = page.locator('.consent-banner__btn--accept');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }

    // Launch first available game
    const gameButton = page.getByRole('button', { name: /^Play /i }).first();
    await gameButton.click();

    // Verify we are in the game launch view
    await expect(page.locator('.game-launch')).toBeVisible();

    // End session to get the summary view
    await page.getByRole('button', { name: /End Session/i }).click();

    // The summary should show "Back to Hub" button
    const backBtn = page.getByRole('button', { name: /Back to Hub/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify we are back at the hub — the launcher/game cards should be visible
    const gameButtons = page.getByRole('button', { name: /^Play /i });
    await expect(gameButtons.first()).toBeVisible();

    // The top bar should show the site title
    await expect(page.locator('.top-bar__title')).toContainText('Basil Board Games');
  });
});
