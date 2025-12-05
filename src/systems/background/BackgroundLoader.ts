import Phaser from 'phaser';
import { BACKGROUND_KEYS } from './BackgroundKeys';
import { LevelImageLoader } from './LevelImageLoader';

/**
 * Background Loader - Handles loading background images
 * 
 * This system loads all background images during the preload phase
 * and creates placeholder backgrounds for missing images.
 */
export class BackgroundLoader {
  /**
   * Load all background images in the preload scene
   */
  static preloadBackgrounds(scene: Phaser.Scene): void {
    console.log('[BackgroundLoader] Loading background images...');

    // Load level room images (actual game backgrounds)
    LevelImageLoader.preloadAllLevelImages(scene);

    // Create placeholder background (always available as fallback)
    this.createPlaceholderBackground(scene);
  }

  /**
   * Create placeholder background for missing images
   */
  private static createPlaceholderBackground(scene: Phaser.Scene): void {
    // Only create if it doesn't exist
    if (scene.textures.exists(BACKGROUND_KEYS.PLACEHOLDER)) {
      return;
    }

    const graphics = scene.add.graphics();
    const width = 2000;
    const height = 576;
    
    // Create a simple gradient background
    graphics.fillGradientStyle(0x222222, 0x222222, 0x111111, 0x111111, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add some grid lines for reference
    graphics.lineStyle(1, 0x333333, 0.3);
    for (let x = 0; x < width; x += 100) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 100) {
      graphics.lineBetween(0, y, width, y);
    }
    
    // Add text label
    graphics.fillStyle(0x666666, 0.5);
    graphics.fillRect(width / 2 - 100, height / 2 - 20, 200, 40);
    
    graphics.generateTexture(BACKGROUND_KEYS.PLACEHOLDER, width, height);
    graphics.destroy();
    
    console.log(`[BackgroundLoader] Created placeholder background: ${BACKGROUND_KEYS.PLACEHOLDER}`);
  }

  /**
   * Check if a background image is loaded
   */
  static isBackgroundLoaded(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key);
  }

  /**
   * Get background key or placeholder if not available
   */
  static getBackgroundKey(scene: Phaser.Scene, key: string): string {
    return scene.textures.exists(key) ? key : BACKGROUND_KEYS.PLACEHOLDER;
  }
}

