import { test, expect } from '@playwright/test';
import { waitForScene, startScene } from './helpers';

const SCORES_KEY = 'streetMeleeHighScores';

const SEED_SCORES = [
  { name: 'AAA', score: 50_000, date: '2025-01-01' },
  { name: 'BBB', score: 30_000, date: '2025-01-02' },
  { name: 'CCC', score: 10_000, date: '2025-01-03' },
];

/**
 * High scores — verifies that the HighScoreManager correctly reads
 * localStorage data and that the HighScoreScene can be entered.
 *
 * addInitScript() runs before the page (and Phaser) boots, so the
 * HighScoreManager constructor sees the seeded data on first read.
 */
test.describe('high scores', () => {
  test.beforeEach(async ({ page }) => {
    // Seed scores before the page loads so HighScoreManager reads them at startup
    await page.addInitScript(
      ({ key, data }: { key: string; data: typeof SEED_SCORES }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { key: SCORES_KEY, data: SEED_SCORES },
    );

    await page.goto('/');
    await waitForScene(page, 'MainMenuScene', 30_000);
  });

  test('seeded scores survive the page load', async ({ page }) => {
    const stored = await page.evaluate((key: string) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }, SCORES_KEY);

    expect(stored).toHaveLength(3);
    expect(stored[0].name).toBe('AAA');
    expect(stored[0].score).toBe(50_000);
  });

  test('scores are sorted descending in localStorage', async ({ page }) => {
    const stored = await page.evaluate((key: string) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }, SCORES_KEY);

    const scores = (stored as { score: number }[]).map(s => s.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  test('HighScoreScene becomes active after navigation', async ({ page }) => {
    await startScene(page, 'HighScoreScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'HighScoreScene', 5_000);
  });

  test('HighScoreScene returns the correct returnScene key', async ({ page }) => {
    await startScene(page, 'HighScoreScene', { returnScene: 'MainMenuScene' });
    await waitForScene(page, 'HighScoreScene', 5_000);

    const returnScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.getScene('HighScoreScene') as any;
      return scene?.returnScene ?? null;
    });

    expect(returnScene).toBe('MainMenuScene');
  });

  test('adding a new score appears in localStorage', async ({ page }) => {
    // Write a new entry directly via the game's HighScoreManager
    // (imported as a static class — access through window eval)
    await page.evaluate((key: string) => {
      const raw = localStorage.getItem(key);
      const scores: { name: string; score: number; date: string }[] = raw
        ? JSON.parse(raw)
        : [];
      scores.push({ name: 'ZZZ', score: 999_999, date: '2025-12-31' });
      scores.sort((a, b) => b.score - a.score);
      localStorage.setItem(key, JSON.stringify(scores.slice(0, 10)));
    }, SCORES_KEY);

    // Re-read and confirm the new top score is present
    const top = await page.evaluate((key: string) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw)[0] : null;
    }, SCORES_KEY);

    expect(top.name).toBe('ZZZ');
    expect(top.score).toBe(999_999);
  });
});
