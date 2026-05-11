import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

/**
 * Smoke tests — basic sanity checks that the game loads and
 * progresses from the preload screen to the main menu without errors.
 */
test.describe('smoke', () => {
  test('page loads a canvas element', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10_000 });
  });

  test('window.__PHASER_GAME__ is exposed', async ({ page }) => {
    await page.goto('/');
    const hasGame = await page.waitForFunction(
      () => !!(window as any).__PHASER_GAME__,
      { timeout: 10_000 },
    );
    expect(hasGame).toBeTruthy();
  });

  test('game transitions from PreloadScene to MainMenuScene', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page, 'MainMenuScene', 20_000);
  });

  test('no uncaught JavaScript errors on startup', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await waitForScene(page, 'MainMenuScene', 20_000);

    expect(errors).toHaveLength(0);
  });

  test('canvas is rendered at a non-zero size', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window as any).__PHASER_GAME__, { timeout: 10_000 });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
