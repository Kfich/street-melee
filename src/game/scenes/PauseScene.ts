import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuContainer } from '../../ui/menu/MenuContainer';
import { AudioManager } from '../../systems/audio/AudioManager';

export class PauseScene extends BaseMenuScene {
  private gameSceneKey: string = 'GameScene';

  constructor() {
    super('PauseScene');
  }

  init(data: { gameSceneKey?: string }) {
    if (data.gameSceneKey) {
      this.gameSceneKey = data.gameSceneKey;
    }
  }

  create() {
    // Get audio manager from game scene
    const gameScene = this.scene.get('GameScene');
    if (gameScene && 'audioManager' in gameScene) {
      this.audioManager = (gameScene as any).audioManager as AudioManager;
      // Pause music when pausing
      if (this.audioManager) {
        this.audioManager.pauseMusic();
      }
    }

    super.create();

    // Semi-transparent overlay (darker for pause)
    if (this.background) {
      this.background.setFillStyle(0x000000, 0.8);
    }

    // Keyboard controls
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resume();
    });
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Create menu container
    this.menuContainer = new MenuContainer(
      this,
      width / 2,
      height / 2 - 50,
      'PAUSED',
      this.theme,
      undefined,
      this.audioManager
    );

    // Add menu buttons
    this.menuContainer.addButton('RESUME', () => this.resume());
    this.menuContainer.addButton('SETTINGS', () => this.openSettings());
    this.menuContainer.addButton('MAIN MENU', () => this.returnToMenu());
  }

  protected playMenuMusic() {
    // Don't play music in pause menu
  }

  private resume() {
    // Resume music when resuming
    if (this.audioManager) {
      this.audioManager.resumeMusic();
    }
    this.scene.resume(this.gameSceneKey);
    
    // Resume game clock
    const gameScene = this.scene.get(this.gameSceneKey);
    if (gameScene && (gameScene as any).widgetManager) {
      (gameScene as any).widgetManager.startClock();
    }
    
    this.scene.stop();
  }

  private openSettings() {
    // Stop pause scene and launch settings, passing pause scene key so we can return
    this.scene.stop();
    this.scene.launch('SettingsScene', { returnScene: 'PauseScene', gameSceneKey: this.gameSceneKey });
  }

  private returnToMenu() {
    // Stop gameplay music when returning to menu
    if (this.audioManager) {
      this.audioManager.stopMusic(true, 500);
    }
    this.scene.stop(this.gameSceneKey);
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    // Resume music if scene is closed without resuming
    if (this.audioManager) {
      this.audioManager.resumeMusic();
    }
  }
}

