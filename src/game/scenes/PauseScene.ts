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
      // Duck the underlying gameplay/boss music and lay the soft pause_ambient
      // loop on top. duckMusic + playPauseAmbient are both idempotent, so
      // re-entering pause (e.g. from settings menu) does not stack loops.
      if (this.audioManager) {
        this.audioManager.duckMusic(0.2, 200);
        this.audioManager.playPauseAmbient();
      }
    }

    super.create();

    // Semi-transparent overlay (darker for pause)
    if (this.background) {
      this.background.setFillStyle(0x000000, 0.88);
    }

    // Override the flash from BaseMenuScene — we don't want a white flash on pause
    this.cameras.main.resetFX();

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
    // Drop the pause ambient and ramp gameplay/boss music back up.
    if (this.audioManager) {
      this.audioManager.stopPauseAmbient();
      this.audioManager.unduckMusic(200);
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
    // Tear down the pause overlay and fade the underlying track out fully
    // before handing off to the main menu.
    if (this.audioManager) {
      this.audioManager.stopPauseAmbient();
      this.audioManager.stopMusic(true, 500);
    }
    this.scene.stop(this.gameSceneKey);
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    // Safety net: if the pause scene is closed via a path other than resume()
    // (e.g. opening Settings), still drop the ambient overlay so it can be
    // restarted cleanly on the next pause.
    if (this.audioManager) {
      this.audioManager.stopPauseAmbient();
      this.audioManager.unduckMusic(150);
    }
  }
}

