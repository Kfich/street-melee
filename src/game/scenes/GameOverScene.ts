import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuContainer } from '../../ui/menu/MenuContainer';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';

export class GameOverScene extends BaseMenuScene {
  private isVictory: boolean = false;
  private score: number = 0;
  private titleText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;

  constructor() {
    super('GameOverScene');
  }

  init(data: { victory?: boolean; score?: number }) {
    this.isVictory = data.victory || false;
    this.score = data.score || 0;
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Initialize audio manager (override base class)
    this.audioManager = new AudioManager(this);

    // Stop gameplay music first
    this.audioManager.stopMusic(true, 500);

    // Play game over sound
    this.time.delayedCall(100, () => {
      if (this.isVictory) {
        this.audioManager?.playSound('levelAdvance');
      } else {
        this.audioManager?.playSound('gameOver');
        this.time.delayedCall(500, () => {
          this.audioManager?.playMusicWithContext('dialogue', MusicContext.GAME_OVER, false);
        });
      }
    });

    // Darker background for game over
    if (this.background) {
      this.background.setFillStyle(0x000000, 0.95);
    }

    // Create title with animation
    const titleText = this.isVictory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.isVictory ? 0x00ff00 : 0xff0000;

    this.titleText = this.add.text(width / 2, height / 3, titleText, {
      fontSize: '80px',
      fontFamily: this.theme.typography.titleFont,
      color: `#${titleColor.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5).setDepth(1001);
    this.titleText.setAlpha(0);
    this.titleText.setScale(0.5);

    // Animate title entrance
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Create score text with animation
    this.scoreText = this.add.text(width / 2, height / 2 - 30, `Final Score: ${this.score}`, {
      fontSize: '36px',
      fontFamily: this.theme.typography.itemFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
    });
    this.scoreText.setOrigin(0.5).setDepth(1001);
    this.scoreText.setAlpha(0);

    // Animate score text entrance (delayed)
    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      y: height / 2 - 30,
      duration: 500,
      delay: 300,
      ease: 'Power2',
    });

    // Create menu
    this.createMenu();
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Create menu container (delayed to appear after title animation)
    this.time.delayedCall(800, () => {
      this.menuContainer = new MenuContainer(
        this,
        width / 2,
        height / 2 + 80,
        '',
        this.theme,
        undefined,
        this.audioManager
      );

      // Add menu buttons
      this.menuContainer.addButton('PLAY AGAIN', () => this.playAgain());
      this.menuContainer.addButton('MAIN MENU', () => this.returnToMenu());
      
      // Fade in menu
      if (this.menuContainer) {
        const container = this.menuContainer as any;
        if (container.container) {
          container.container.setAlpha(0);
          this.tweens.add({
            targets: container.container,
            alpha: 1,
            duration: 400,
            ease: 'Power2',
          });
        }
      }
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.audioManager) {
        this.audioManager.playSound('menuSelect');
      }
      this.returnToMenu();
    });
  }

  protected playMenuMusic() {
    // Music handled in create()
  }

  private playAgain() {
    // Stop this scene and start character select fresh
    this.scene.stop('GameOverScene');
    this.scene.start('CharacterSelectScene', {
      isMultiplayer: false
    });
  }

  private returnToMenu() {
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }
  }
}

