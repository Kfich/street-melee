import { test, expect } from '@playwright/test';
import { waitForScene, startScene, getActiveScenes } from './helpers';

/**
 * Scene navigation — verifies that the major menu scenes
 * can be entered and exited cleanly.
 *
 * Tests use startScene() to bypass button-click timing fragility;
 * the return journey uses keyboard events to exercise the real input handlers.
 */
test.describe('scene navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page, 'MainMenuScene', 20_000);
  });

  // ── High Scores ────────────────────────────────────────────────────────────

  test('navigates to HighScoreScene', async ({ page }) => {
    await startScene(page, 'HighScoreScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'HighScoreScene', 5_000);

    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('HighScoreScene');
  });

  test('returns from HighScoreScene to MainMenuScene via Escape', async ({ page }) => {
    await startScene(page, 'HighScoreScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'HighScoreScene', 5_000);

    await page.waitForTimeout(200); // allow input handlers to attach
    await page.keyboard.press('Escape');

    await waitForScene(page, 'MainMenuScene', 5_000);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('MainMenuScene');
  });

  test('returns from HighScoreScene to MainMenuScene via Enter', async ({ page }) => {
    await startScene(page, 'HighScoreScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'HighScoreScene', 5_000);

    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');

    await waitForScene(page, 'MainMenuScene', 5_000);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('MainMenuScene');
  });

  // ── Settings ───────────────────────────────────────────────────────────────

  test('navigates to SettingsScene', async ({ page }) => {
    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);

    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('SettingsScene');
  });

  test('returns from SettingsScene to MainMenuScene via Escape', async ({ page }) => {
    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);

    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');

    await waitForScene(page, 'MainMenuScene', 5_000);
    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('MainMenuScene');
  });

  // ── Controls ───────────────────────────────────────────────────────────────

  test('navigates to ControlsScene', async ({ page }) => {
    await startScene(page, 'ControlsScene');
    await waitForScene(page, 'ControlsScene', 5_000);

    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('ControlsScene');
  });

  // ── Character Select ───────────────────────────────────────────────────────

  test('navigates to CharacterSelectScene for single player', async ({ page }) => {
    await startScene(page, 'CharacterSelectScene', { isMultiplayer: false });
    await waitForScene(page, 'CharacterSelectScene', 5_000);

    const scenes = await getActiveScenes(page);
    expect(scenes).toContain('CharacterSelectScene');
  });
});
