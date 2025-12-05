import Phaser from 'phaser';
import { AudioManager } from '../../systems/audio/AudioManager';

export class PauseScene extends Phaser.Scene {
  private gameSceneKey: string = 'GameScene';
  private audioManager?: AudioManager;

  constructor() {
    super({ key: 'PauseScene' });
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

    const { width, height } = this.cameras.main;

    // Semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Pause title
    this.add.text(width / 2, height / 2 - 150, 'PAUSED', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Menu options
    const menuOptions = [
      { text: 'RESUME', action: () => this.resume() },
      { text: 'SETTINGS', action: () => this.openSettings() },
      { text: 'MAIN MENU', action: () => this.returnToMenu() }
    ];

    const startY = height / 2;
    const spacing = 70;

    menuOptions.forEach((option, index) => {
      const menuItem = this.add.text(width / 2, startY + (index * spacing), option.text, {
        fontSize: '40px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffff00' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuItem.on('pointerdown', option.action);
      menuItem.on('pointerover', () => {
        menuItem.setStyle({ color: '#ffff00' });
      });
      menuItem.on('pointerout', () => {
        menuItem.setStyle({ color: index === 0 ? '#ffff00' : '#ffffff' });
      });
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resume();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      menuOptions[0].action();
    });
  }

  private resume() {
    // Resume music when resuming
    if (this.audioManager) {
      this.audioManager.resumeMusic();
    }
    this.scene.resume(this.gameSceneKey);
    this.scene.stop();
  }

  private openSettings() {
    this.scene.pause(this.gameSceneKey);
    this.scene.launch('SettingsScene', { returnScene: this.gameSceneKey });
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

