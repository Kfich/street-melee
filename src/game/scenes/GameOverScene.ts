import Phaser from 'phaser';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';

export class GameOverScene extends Phaser.Scene {
  private isVictory: boolean = false;
  private score: number = 0;
  private finalScoreText?: Phaser.GameObjects.Text;
  private audioManager!: AudioManager;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { victory?: boolean; score?: number }) {
    this.isVictory = data.victory || false;
    this.score = data.score || 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    
    // Stop gameplay music first
    this.audioManager.stopMusic(true, 500);
    
    // Play game over sound (with delay to ensure audio is ready)
    this.time.delayedCall(100, () => {
      if (this.isVictory) {
        this.audioManager.playSound('levelAdvance');
      } else {
        this.audioManager.playSound('gameOver');
        // Play game over screen music after a delay
        this.time.delayedCall(500, () => {
          this.audioManager.playMusicWithContext('dialogue', MusicContext.GAME_OVER, false);
        });
      }
    });
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

    // Title
    const titleText = this.isVictory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.isVictory ? '#00ff00' : '#ff0000';

    this.add.text(width / 2, height / 3, titleText, {
      fontSize: '80px',
      fontFamily: 'Arial',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score
    this.finalScoreText = this.add.text(width / 2, height / 2 - 50, `Final Score: ${this.score}`, {
      fontSize: '36px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Menu options
    const menuOptions = [
      { text: 'PLAY AGAIN', action: () => this.playAgain() },
      { text: 'MAIN MENU', action: () => this.returnToMenu() }
    ];

    const startY = height / 2 + 100;
    const spacing = 80;

    menuOptions.forEach((option, index) => {
      const menuItem = this.add.text(width / 2, startY + (index * spacing), option.text, {
        fontSize: '40px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffff00' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuItem.on('pointerdown', () => {
        this.audioManager.playSound('menuSelect');
        option.action();
      });
      menuItem.on('pointerover', () => {
        this.audioManager.playSound('menuSelect', 0.5);
        menuItem.setStyle({ color: '#ffff00' });
      });
      menuItem.on('pointerout', () => {
        menuItem.setStyle({ color: index === 0 ? '#ffff00' : '#ffffff' });
      });
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.audioManager.playSound('menuSelect');
      menuOptions[0].action();
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.audioManager.playSound('menuSelect');
      menuOptions[1].action();
    });
  }

  shutdown() {
    // Stop music when leaving scene
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }
  }

  private playAgain() {
    this.scene.start('CharacterSelectScene');
  }

  private returnToMenu() {
    this.scene.start('MainMenuScene');
  }
}

