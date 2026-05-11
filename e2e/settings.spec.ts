import { test, expect } from '@playwright/test';
import { waitForScene, startScene } from './helpers';

/**
 * Key used by both SettingsScene.saveSettings() and AudioManager.loadSettings().
 * SettingsScene writes on ESC/BACK; AudioManager reads on construction.
 */
const SETTINGS_KEY = 'streetMeleeSettings';

/**
 * Settings — verifies that settings are persisted to localStorage by
 * SettingsScene and are picked up correctly on subsequent page loads.
 */
test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForScene(page, 'MainMenuScene', 20_000);
  });

  // ── Scene activation ───────────────────────────────────────────────────────

  test('SettingsScene becomes active', async ({ page }) => {
    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);
  });

  test('SettingsScene loads default values when no localStorage entry exists', async ({ page }) => {
    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);

    // SettingsScene stores values in private fields — read them directly via evaluate
    const { musicVolume, sfxVolume, musicEnabled, sfxEnabled } = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.getScene('SettingsScene') as any;
      return {
        musicVolume:  scene?.musicVolume,
        sfxVolume:    scene?.sfxVolume,
        musicEnabled: scene?.musicEnabled,
        sfxEnabled:   scene?.sfxEnabled,
      };
    });

    expect(musicVolume).toBeCloseTo(0.5, 5);
    expect(sfxVolume).toBeCloseTo(0.7, 5);
    expect(musicEnabled).toBe(true);
    expect(sfxEnabled).toBe(true);
  });

  // ── Persistence ───────────────────────────────────────────────────────────

  test('settings written to localStorage are read back by SettingsScene on next load', async ({ page }) => {
    const custom = { musicVolume: 0.2, sfxVolume: 0.8, musicEnabled: false, sfxEnabled: true };

    // Write settings before reload
    await page.evaluate(
      ({ key, data }: { key: string; data: typeof custom }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { key: SETTINGS_KEY, data: custom },
    );

    // Reload and navigate to SettingsScene (its loadSettings() runs in createMenu)
    await page.reload();
    await waitForScene(page, 'MainMenuScene', 20_000);

    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);

    const { musicVolume, musicEnabled } = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.getScene('SettingsScene') as any;
      return {
        musicVolume:  scene?.musicVolume,
        musicEnabled: scene?.musicEnabled,
      };
    });

    expect(musicVolume).toBeCloseTo(0.2, 5);
    expect(musicEnabled).toBe(false);
  });

  test('saveSettings is called when navigating away via Escape', async ({ page }) => {
    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);

    await page.waitForTimeout(200);
    // Pressing ESC calls saveSettings() then returnToPrevious()
    await page.keyboard.press('Escape');
    await waitForScene(page, 'MainMenuScene', 5_000);

    // Settings key should now exist in localStorage (written by saveSettings)
    const exists = await page.evaluate(
      (key: string) => localStorage.getItem(key) !== null,
      SETTINGS_KEY,
    );
    expect(exists).toBe(true);
  });

  test('saved settings survive a page reload', async ({ page }) => {
    // Seed known values via addInitScript so they're in place before ANY JS runs
    const custom = { musicVolume: 0.35, sfxVolume: 0.65, musicEnabled: true, sfxEnabled: false };

    await page.addInitScript(
      ({ key, data }: { key: string; data: typeof custom }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { key: SETTINGS_KEY, data: custom },
    );

    await page.reload();
    await waitForScene(page, 'MainMenuScene', 20_000);

    // Verify the raw localStorage value is intact after reload
    const restored = await page.evaluate((key: string) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, SETTINGS_KEY);

    expect(restored).not.toBeNull();
    expect(restored.musicVolume).toBeCloseTo(0.35, 5);
    expect(restored.sfxVolume).toBeCloseTo(0.65, 5);
    expect(restored.sfxEnabled).toBe(false);
  });

  test('AudioManager reads custom settings from localStorage', async ({ page }) => {
    const custom = { musicVolume: 0.3, sfxVolume: 0.6, musicEnabled: true, sfxEnabled: false };

    await page.addInitScript(
      ({ key, data }: { key: string; data: typeof custom }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { key: SETTINGS_KEY, data: custom },
    );

    await page.reload();
    await waitForScene(page, 'MainMenuScene', 20_000);

    // SettingsScene constructs an AudioManager — navigate to it so AM is created
    await startScene(page, 'SettingsScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'SettingsScene', 5_000);

    // AudioManager is on BaseMenuScene as this.audioManager (public-ish via prototype)
    const { musicVolume, sfxEnabled } = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.getScene('SettingsScene') as any;
      const am = scene?.audioManager;
      return {
        musicVolume: am?.getMusicVolume?.() ?? null,
        sfxEnabled:  am?.isSFXEnabled?.()  ?? null,
      };
    });

    expect(musicVolume).toBeCloseTo(0.3, 5);
    expect(sfxEnabled).toBe(false);
  });
});
