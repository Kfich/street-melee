import Phaser from 'phaser';
import { MenuTheme, DEFAULT_MENU_THEME } from './MenuTheme';
import { MenuContainer } from './MenuContainer';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';

/**
 * Base class for all menu scenes with common functionality
 */
export abstract class BaseMenuScene extends Phaser.Scene {
  protected theme: MenuTheme;
  protected menuContainer?: MenuContainer;
  protected audioManager?: AudioManager;
  protected background?: Phaser.GameObjects.Rectangle;

  constructor(key: string, theme?: MenuTheme) {
    super({ key });
    this.theme = theme || DEFAULT_MENU_THEME;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Initialize audio manager (only if not already set)
    if (!this.audioManager) {
      this.audioManager = new AudioManager(this);
    }

    // Create background
    this.background = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      this.theme.colors.background,
      this.theme.colors.backgroundAlpha
    );
    this.background.setDepth(0);

    // Play menu music if needed
    this.playMenuMusic();

    // Create menu (to be implemented by subclasses)
    this.createMenu();
  }

  protected abstract createMenu(): void;

  protected playMenuMusic() {
    // Override in subclasses if needed
    this.time.delayedCall(100, () => {
      if (this.audioManager) {
        this.audioManager.playMusicWithContext('menu', MusicContext.MENU, true);
      }
    });
  }

  update() {
    if (this.menuContainer) {
      this.menuContainer.update();
    }
  }

  shutdown() {
    // Stop music when leaving menu
    if (this.audioManager) {
      this.audioManager.stopMusic(true);
    }
  }
}

