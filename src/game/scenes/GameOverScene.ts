import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuContainer } from '../../ui/menu/MenuContainer';
import { MusicContext } from '../../systems/audio/MusicState';

export class GameOverScene extends BaseMenuScene {
  private isVictory: boolean = false;
  private score: number = 0;
  private gameTime: number = 0;
  private titleText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;

  constructor() {
    super('GameOverScene');
  }

  init(data: { victory?: boolean; score?: number; time?: number }) {
    this.isVictory = data.victory || false;
    this.score = data.score || 0;
    this.gameTime = data.time || 0;
  }

  create() {
    // super.create() initializes this.audioManager, creates the background,
    // and calls this.createMenu() — do not call createMenu() again here.
    super.create();

    const { width, height } = this.cameras.main;

    // Override background to near-black
    if (this.background) {
      this.background.setFillStyle(0x000000, 0.95);
    }

    // Stop gameplay music then play context-appropriate audio
    this.audioManager?.stopMusic(true, 500);
    this.time.delayedCall(100, () => {
      if (this.isVictory) {
        this.audioManager?.playSound('levelAdvance');
        this.time.delayedCall(1000, () => {
          this.audioManager?.playMusicWithContext('menu', MusicContext.MENU, true);
        });
      } else {
        this.audioManager?.playSound('gameOver');
        this.time.delayedCall(500, () => {
          this.audioManager?.playMusicWithContext('dialogue', MusicContext.GAME_OVER, false);
        });
      }
    });

    // Title
    const titleColor = this.isVictory ? '#00ff00' : '#ff0000';
    this.titleText = this.add.text(
      width / 2,
      height / 3,
      this.isVictory ? 'VICTORY!' : 'GAME OVER',
      {
        fontSize: '80px',
        fontFamily: this.theme.typography.titleFont,
        color: titleColor,
        stroke: '#000000',
        strokeThickness: this.theme.typography.titleStroke,
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0.5).setDepth(1001).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Score
    this.scoreText = this.add.text(
      width / 2,
      height / 2 - 30,
      `SCORE: ${this.score.toLocaleString()}`,
      {
        fontSize: '24px',
        fontFamily: this.theme.typography.itemFont,
        color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.scoreText.setOrigin(0.5).setDepth(1001).setAlpha(0);

    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      duration: 500,
      delay: 400,
      ease: 'Power2',
    });

    // Time display (only shown when time data is available)
    if (this.gameTime > 0) {
      const minutes = Math.floor(this.gameTime / 60);
      const seconds = this.gameTime % 60;
      const timeLabel = `TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      this.timeText = this.add.text(
        width / 2,
        height / 2 + 10,
        timeLabel,
        {
          fontSize: '18px',
          fontFamily: this.theme.typography.itemFont,
          color: '#aaaaaa',
          stroke: '#000000',
          strokeThickness: 2,
        }
      );
      this.timeText.setOrigin(0.5).setDepth(1001).setAlpha(0);

      this.tweens.add({
        targets: this.timeText,
        alpha: 1,
        duration: 500,
        delay: 600,
        ease: 'Power2',
      });
    }
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Delay menu appearance until after the title animation finishes
    this.time.delayedCall(800, () => {
      this.menuContainer = new MenuContainer(
        this,
        width / 2,
        height / 2 + 100,
        '',
        this.theme,
        undefined,
        this.audioManager
      );

      this.menuContainer.addButton('PLAY AGAIN', () => this.playAgain());
      this.menuContainer.addButton('MAIN MENU', () => this.returnToMenu());

      this.menuContainer.getContainer().setAlpha(0);
      this.tweens.add({
        targets: this.menuContainer.getContainer(),
        alpha: 1,
        duration: 400,
        ease: 'Power2',
      });
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.audioManager?.playSound('menuSelect');
      this.returnToMenu();
    });
  }

  protected playMenuMusic() {
    // Audio is handled in create() after the base class setup completes
  }

  private playAgain() {
    this.scene.stop('GameOverScene');
    this.scene.start('CharacterSelectScene', {
      isMultiplayer: false,
    });
  }

  private returnToMenu() {
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    this.audioManager?.stopMusic(true);
  }
}
