import { Page } from '@playwright/test';

/**
 * Block until the named Phaser scene is both created and marked active.
 * Polling interval is 100 ms; the default timeout is 20 s.
 */
export async function waitForScene(
  page: Page,
  sceneName: string,
  timeout = 20_000,
): Promise<void> {
  await page.waitForFunction(
    (name: string) => {
      const game = (window as any).__PHASER_GAME__;
      if (!game?.scene) return false;
      return game.scene.isActive(name);
    },
    sceneName,
    { timeout, polling: 100 },
  );
}

/**
 * Return the keys of all currently active Phaser scenes.
 */
export async function getActiveScenes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game?.scene) return [];
    return (game.scene.scenes as any[])
      .filter(s => game.scene.isActive(s.sys.settings.key))
      .map(s => s.sys.settings.key as string);
  });
}

/**
 * Programmatically start a Phaser scene (bypasses button clicks / animations).
 * Useful for navigating directly to a scene without relying on exact cursor positions.
 */
export async function startScene(
  page: Page,
  sceneKey: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }: { key: string; sceneData: Record<string, unknown> }) => {
      const game = (window as any).__PHASER_GAME__;
      game.scene.start(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
}

/**
 * Return the value of a Phaser scene's registry / data manager entry,
 * or a nested property reached by dotted path (e.g. 'sys.settings.key').
 */
export async function getSceneData(
  page: Page,
  sceneKey: string,
  propertyPath: string,
): Promise<unknown> {
  return page.evaluate(
    ({ key, path }: { key: string; path: string }) => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.getScene(key);
      if (!scene) return undefined;
      return path.split('.').reduce((obj: any, k) => obj?.[k], scene);
    },
    { key: sceneKey, path: propertyPath },
  );
}
