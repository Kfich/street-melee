import { test, expect } from '@playwright/test';
import { waitForScene, getActiveScenes } from './helpers';

/**
 * Main menu — verifies the scene is active and that keyboard
 * navigation triggers the expected scene transitions.
 */
test.describe('main menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page, 'MainMenuScene', 20_000);
  });

  test('MainMenuScene is active after load', async ({ page }) => {
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('MainMenuScene');
  });

  test('game instance has MainMenuScene registered', async ({ page }) => {
    const hasScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return !!game?.scene?.getScene('MainMenuScene');
    });
    expect(hasScene).toBe(true);
  });

  test('all expected scenes are registered in the game', async ({ page }) => {
    const keys = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return (game.scene.scenes as any[]).map(s => s.sys.settings.key as string);
    });
    const expected = [
      'PreloadScene',
      'MainMenuScene',
      'CharacterSelectScene',
      'GameScene',
      'SettingsScene',
      'HighScoreScene',
      'PauseScene',
      'GameOverScene',
    ];
    for (const key of expected) {
      expect(keys).toContain(key);
    }
  });

  test('pressing Enter selects the first button and starts CharacterSelectScene', async ({ page }) => {
    // Wait a tick for the scene's input listeners to register
    await page.waitForTimeout(300);

    await page.keyboard.press('Enter');
    await waitForScene(page, 'CharacterSelectScene', 10_000);

    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('CharacterSelectScene');
  });
});
